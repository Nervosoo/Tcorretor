import { randomBytes } from "node:crypto";
import { nextId, readStore, writeStore } from "../db/sqlite.js";
import type { LicenseAccount } from "../types.js";

type CustomerRecord = {
  id: number;
  email: string;
  stripe_customer_id: string | null;
};

type SubscriptionRecord = {
  id: number;
  customer_id: number;
  stripe_subscription_id: string;
  stripe_checkout_session_id: string | null;
  price_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: number;
  plan: string;
  max_text_length: number;
};

type LicenseRecord = {
  token: string;
  name: string;
  plan: string;
  max_text_length: number;
  commercial_use: number;
};

type LicenseForSubscriptionRecord = {
  token: string;
  plan: string;
  delivery_email: string | null;
  delivery_sent_at: string | null;
};

type UpsertCustomerInput = {
  email: string;
  stripeCustomerId: string;
};

type UpsertSubscriptionInput = {
  customerId: number;
  stripeSubscriptionId: string;
  stripeCheckoutSessionId?: string | null;
  priceId?: string | null;
  status: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd: boolean;
  plan: string;
  maxTextLength: number;
};

const now = () => new Date().toISOString();

const generateLicenseToken = () => {
  return `lic_${randomBytes(24).toString("hex")}`;
};

const activeLicenseStatuses = new Set(["active", "trialing", "past_due"]);

export const upsertCustomer = (input: UpsertCustomerInput) => {
  const store = readStore();
  const existing = store.customers.find((customer) => customer.stripe_customer_id === input.stripeCustomerId);

  if (existing) {
    existing.email = input.email;
    existing.updated_at = now();
    writeStore(store);
    return { ...existing, email: input.email };
  }

  const timestamp = now();
  const created = {
    id: nextId(store.customers),
    email: input.email,
    stripe_customer_id: input.stripeCustomerId,
    created_at: timestamp,
    updated_at: timestamp
  };

  store.customers.push(created);
  writeStore(store);

  return {
    id: created.id,
    email: input.email,
    stripe_customer_id: input.stripeCustomerId
  } satisfies CustomerRecord;
};

export const findCustomerByStripeCustomerId = (stripeCustomerId: string) => {
  const store = readStore();
  return store.customers.find((customer) => customer.stripe_customer_id === stripeCustomerId);
};

export const upsertSubscription = (input: UpsertSubscriptionInput) => {
  const store = readStore();
  const existing = store.subscriptions.find((subscription) => subscription.stripe_subscription_id === input.stripeSubscriptionId);

  const timestamp = now();

  if (existing) {
    existing.customer_id = input.customerId;
    existing.stripe_checkout_session_id = input.stripeCheckoutSessionId ?? existing.stripe_checkout_session_id;
    existing.price_id = input.priceId ?? existing.price_id;
    existing.status = input.status;
    existing.current_period_end = input.currentPeriodEnd ?? null;
    existing.cancel_at_period_end = input.cancelAtPeriodEnd ? 1 : 0;
    existing.plan = input.plan;
    existing.max_text_length = input.maxTextLength;
    existing.updated_at = timestamp;
    writeStore(store);

    return {
      ...existing,
      customer_id: input.customerId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId ?? existing.stripe_checkout_session_id,
      price_id: input.priceId ?? existing.price_id,
      status: input.status,
      current_period_end: input.currentPeriodEnd ?? null,
      cancel_at_period_end: input.cancelAtPeriodEnd ? 1 : 0,
      plan: input.plan,
      max_text_length: input.maxTextLength
    } satisfies SubscriptionRecord;
  }

  const created = {
    id: nextId(store.subscriptions),
    customer_id: input.customerId,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
    price_id: input.priceId ?? null,
    status: input.status,
    current_period_end: input.currentPeriodEnd ?? null,
    cancel_at_period_end: input.cancelAtPeriodEnd ? 1 : 0,
    plan: input.plan,
    max_text_length: input.maxTextLength,
    created_at: timestamp,
    updated_at: timestamp
  };

  store.subscriptions.push(created);
  writeStore(store);

  return {
    id: created.id,
    customer_id: input.customerId,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
    price_id: input.priceId ?? null,
    status: input.status,
    current_period_end: input.currentPeriodEnd ?? null,
    cancel_at_period_end: input.cancelAtPeriodEnd ? 1 : 0,
    plan: input.plan,
    max_text_length: input.maxTextLength
  } satisfies SubscriptionRecord;
};

export const ensureLicenseForSubscription = (subscription: SubscriptionRecord, customer: CustomerRecord) => {
  const store = readStore();
  const existing = store.licenses.find((license) => license.subscription_id === subscription.id);
  const nextStatus = activeLicenseStatuses.has(subscription.status) ? "active" : "inactive";
  const timestamp = now();

  if (existing) {
    existing.status = nextStatus;
    existing.plan = subscription.plan;
    existing.max_text_length = subscription.max_text_length;
    existing.updated_at = timestamp;
    writeStore(store);
    return existing.token;
  }

  const token = generateLicenseToken();
  store.licenses.push({
    id: nextId(store.licenses),
    customer_id: customer.id,
    subscription_id: subscription.id,
    token,
    status: nextStatus,
    plan: subscription.plan,
    max_text_length: subscription.max_text_length,
    commercial_use: 1,
    delivery_email: null,
    delivery_sent_at: null,
    created_at: timestamp,
    updated_at: timestamp,
    last_validated_at: null
  });
  writeStore(store);

  return token;
};

export const getLicenseForSubscription = (subscriptionId: number) => {
  const store = readStore();
  const license = store.licenses.find((item) => item.subscription_id === subscriptionId);
  if (!license) {
    return undefined;
  }

  return {
    token: license.token,
    plan: license.plan,
    delivery_email: license.delivery_email,
    delivery_sent_at: license.delivery_sent_at
  } satisfies LicenseForSubscriptionRecord;
};

export const markLicenseDelivered = (subscriptionId: number, email: string) => {
  const store = readStore();
  const license = store.licenses.find((item) => item.subscription_id === subscriptionId);
  if (!license) {
    return;
  }

  const timestamp = now();
  license.delivery_email = email;
  license.delivery_sent_at = timestamp;
  license.updated_at = timestamp;
  writeStore(store);
};

export const findLicenseAccountByToken = (token: string): LicenseAccount | null => {
  const store = readStore();
  const license = store.licenses.find((item) => item.token === token && item.status === "active");

  if (!license) {
    return null;
  }

  const customer = store.customers.find((item) => item.id === license.customer_id);
  if (!customer) {
    return null;
  }

  license.last_validated_at = now();
  license.updated_at = now();
  writeStore(store);

  return {
    token: license.token,
    name: customer.email,
    plan: license.plan,
    maxTextLength: license.max_text_length,
    commercialUse: Boolean(license.commercial_use)
  };
};

export const findCheckoutSessionStatus = (sessionId: string) => {
  const store = readStore();
  const subscription = store.subscriptions.find((item) => item.stripe_checkout_session_id === sessionId);

  if (!subscription) {
    return { status: "processing" as const };
  }

  const license = store.licenses.find((item) => item.subscription_id === subscription.id);
  if (!license?.token) {
    return { status: "processing" as const };
  }

  const customer = store.customers.find((item) => item.id === subscription.customer_id);

  return {
    status: "ready" as const,
    token: license.token,
    plan: license.plan ?? "pro",
    customerEmail: customer?.email ?? "",
    emailSent: Boolean(license.delivery_sent_at)
  };
};
