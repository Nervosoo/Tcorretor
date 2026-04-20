import Stripe from "stripe";
import { env } from "../config/env.js";
import {
  ensureLicenseForSubscription,
  findCheckoutSessionStatus,
  findCustomerByStripeCustomerId,
  getLicenseForSubscription,
  markLicenseDelivered,
  upsertCustomer,
  upsertSubscription
} from "./billingRepository.js";
import { sendLicenseEmail } from "./licenseMailer.js";

type CheckoutSessionInput = {
  email: string;
  successUrl?: string;
  cancelUrl?: string;
};

const activeSubscriptionStates = new Set(["active", "trialing", "past_due"]);

const createStripeClient = () => {
  if (!env.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(env.stripeSecretKey);
};

const appendSessionPlaceholder = (url: string) => {
  const parsed = new URL(url);
  parsed.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");
  return parsed.toString();
};

const unixToIso = (value: number | null | undefined) => {
  if (!value) {
    return null;
  }

  return new Date(value * 1000).toISOString();
};

const syncSubscriptionState = async (
  stripe: Stripe,
  stripeSubscriptionId: string,
  stripeCustomerId: string,
  stripeCheckoutSessionId?: string | null,
  email?: string | null
) => {
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as unknown as Stripe.Subscription;
  const resolvedEmail = email?.trim() || findCustomerByStripeCustomerId(stripeCustomerId)?.email;

  if (!resolvedEmail) {
    throw new Error("Unable to resolve customer email for subscription sync");
  }

  const customer = upsertCustomer({
    email: resolvedEmail,
    stripeCustomerId
  });

  const storedSubscription = upsertSubscription({
    customerId: customer.id,
    stripeSubscriptionId,
    stripeCheckoutSessionId,
    priceId: subscription.items.data[0]?.price.id ?? env.stripePriceId,
    status: subscription.status,
    currentPeriodEnd: unixToIso(subscription.items.data[0]?.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    plan: env.billingPlanName,
    maxTextLength: env.billingPlanMaxTextLength
  });

  const token = ensureLicenseForSubscription(storedSubscription, customer);

  return {
    customer,
    subscription: storedSubscription,
    token,
    plan: storedSubscription.plan,
    active: activeSubscriptionStates.has(subscription.status)
  };
};

export const createCheckoutSession = async (input: CheckoutSessionInput) => {
  if (!env.stripePriceId) {
    throw new Error("STRIPE_PRICE_ID is not configured");
  }

  const stripe = createStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: input.email,
    line_items: [
      {
        price: env.stripePriceId,
        quantity: 1
      }
    ],
    allow_promotion_codes: true,
    success_url: appendSessionPlaceholder(input.successUrl || env.checkoutSuccessUrl),
    cancel_url: input.cancelUrl || env.checkoutCancelUrl,
    metadata: {
      plan: env.billingPlanName
    },
    subscription_data: {
      metadata: {
        plan: env.billingPlanName
      }
    }
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url ?? ""
  };
};

export const handleStripeWebhook = async (rawBody: Buffer, signature: string | undefined) => {
  if (!env.stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  if (!signature) {
    throw new Error("Missing Stripe signature");
  }

  const stripe = createStripeClient();
  const event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && typeof session.subscription === "string" && typeof session.customer === "string") {
        const synced = await syncSubscriptionState(
          stripe,
          session.subscription,
          session.customer,
          session.id,
          session.customer_details?.email ?? session.customer_email
        );

        const delivery = getLicenseForSubscription(synced.subscription.id);
        if (synced.active && delivery && !delivery.delivery_sent_at) {
          const mailResult = await sendLicenseEmail({
            to: synced.customer.email,
            token: synced.token,
            plan: synced.plan
          });

          if (mailResult.sent) {
            markLicenseDelivered(synced.subscription.id, synced.customer.email);
          }
        }
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      if (typeof subscription.customer === "string") {
        await syncSubscriptionState(
          stripe,
          subscription.id,
          subscription.customer,
          null,
          null
        );
      }
      break;
    }

    default:
      break;
  }

  return { received: true };
};

export const getCheckoutSessionStatus = (sessionId: string) => {
  return findCheckoutSessionStatus(sessionId);
};
