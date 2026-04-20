import { randomBytes } from "node:crypto";
import { sqlite } from "../db/sqlite.js";
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
  const existing = sqlite.prepare(`SELECT id, email, stripe_customer_id FROM customers WHERE stripe_customer_id = ?`).get(input.stripeCustomerId) as CustomerRecord | undefined;

  if (existing) {
    sqlite.prepare(`UPDATE customers SET email = ?, updated_at = ? WHERE id = ?`).run(input.email, now(), existing.id);
    return { ...existing, email: input.email };
  }

  const timestamp = now();
  const result = sqlite.prepare(`
    INSERT INTO customers (email, stripe_customer_id, created_at, updated_at)
    VALUES (?, ?, ?, ?)
  `).run(input.email, input.stripeCustomerId, timestamp, timestamp);

  return {
    id: Number(result.lastInsertRowid),
    email: input.email,
    stripe_customer_id: input.stripeCustomerId
  } satisfies CustomerRecord;
};

export const findCustomerByStripeCustomerId = (stripeCustomerId: string) => {
  return sqlite.prepare(`SELECT id, email, stripe_customer_id FROM customers WHERE stripe_customer_id = ?`).get(stripeCustomerId) as CustomerRecord | undefined;
};

export const upsertSubscription = (input: UpsertSubscriptionInput) => {
  const existing = sqlite.prepare(`
    SELECT id, customer_id, stripe_subscription_id, stripe_checkout_session_id, price_id, status, current_period_end, cancel_at_period_end, plan, max_text_length
    FROM subscriptions
    WHERE stripe_subscription_id = ?
  `).get(input.stripeSubscriptionId) as SubscriptionRecord | undefined;

  const timestamp = now();

  if (existing) {
    sqlite.prepare(`
      UPDATE subscriptions
      SET customer_id = ?,
          stripe_checkout_session_id = COALESCE(?, stripe_checkout_session_id),
          price_id = COALESCE(?, price_id),
          status = ?,
          current_period_end = ?,
          cancel_at_period_end = ?,
          plan = ?,
          max_text_length = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      input.customerId,
      input.stripeCheckoutSessionId ?? null,
      input.priceId ?? null,
      input.status,
      input.currentPeriodEnd ?? null,
      input.cancelAtPeriodEnd ? 1 : 0,
      input.plan,
      input.maxTextLength,
      timestamp,
      existing.id
    );

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

  const result = sqlite.prepare(`
    INSERT INTO subscriptions (
      customer_id,
      stripe_subscription_id,
      stripe_checkout_session_id,
      price_id,
      status,
      current_period_end,
      cancel_at_period_end,
      plan,
      max_text_length,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.customerId,
    input.stripeSubscriptionId,
    input.stripeCheckoutSessionId ?? null,
    input.priceId ?? null,
    input.status,
    input.currentPeriodEnd ?? null,
    input.cancelAtPeriodEnd ? 1 : 0,
    input.plan,
    input.maxTextLength,
    timestamp,
    timestamp
  );

  return {
    id: Number(result.lastInsertRowid),
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
  const existing = sqlite.prepare(`SELECT token FROM licenses WHERE subscription_id = ?`).get(subscription.id) as { token: string } | undefined;
  const nextStatus = activeLicenseStatuses.has(subscription.status) ? "active" : "inactive";
  const timestamp = now();

  if (existing) {
    sqlite.prepare(`
      UPDATE licenses
      SET status = ?, plan = ?, max_text_length = ?, updated_at = ?
      WHERE subscription_id = ?
    `).run(nextStatus, subscription.plan, subscription.max_text_length, timestamp, subscription.id);
    return existing.token;
  }

  const token = generateLicenseToken();
  sqlite.prepare(`
    INSERT INTO licenses (
      customer_id,
      subscription_id,
      token,
      status,
      plan,
      max_text_length,
      commercial_use,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    customer.id,
    subscription.id,
    token,
    nextStatus,
    subscription.plan,
    subscription.max_text_length,
    1,
    timestamp,
    timestamp
  );

  return token;
};

export const getLicenseForSubscription = (subscriptionId: number) => {
  return sqlite.prepare(`
    SELECT token, plan, delivery_email, delivery_sent_at
    FROM licenses
    WHERE subscription_id = ?
    LIMIT 1
  `).get(subscriptionId) as LicenseForSubscriptionRecord | undefined;
};

export const markLicenseDelivered = (subscriptionId: number, email: string) => {
  const timestamp = now();
  sqlite.prepare(`
    UPDATE licenses
    SET delivery_email = ?, delivery_sent_at = ?, updated_at = ?
    WHERE subscription_id = ?
  `).run(email, timestamp, timestamp, subscriptionId);
};

export const findLicenseAccountByToken = (token: string): LicenseAccount | null => {
  const row = sqlite.prepare(`
    SELECT licenses.token,
           customers.email AS name,
           licenses.plan,
           licenses.max_text_length,
           licenses.commercial_use
    FROM licenses
    INNER JOIN customers ON customers.id = licenses.customer_id
    WHERE licenses.token = ?
      AND licenses.status = 'active'
    LIMIT 1
  `).get(token) as LicenseRecord | undefined;

  if (!row) {
    return null;
  }

  sqlite.prepare(`UPDATE licenses SET last_validated_at = ?, updated_at = ? WHERE token = ?`).run(now(), now(), token);

  return {
    token: row.token,
    name: row.name,
    plan: row.plan,
    maxTextLength: row.max_text_length,
    commercialUse: Boolean(row.commercial_use)
  };
};

export const findCheckoutSessionStatus = (sessionId: string) => {
  const row = sqlite.prepare(`
    SELECT subscriptions.status,
           licenses.token,
           licenses.plan,
           licenses.delivery_sent_at,
           customers.email AS customer_email
    FROM subscriptions
    INNER JOIN customers ON customers.id = subscriptions.customer_id
    LEFT JOIN licenses ON licenses.subscription_id = subscriptions.id
    WHERE subscriptions.stripe_checkout_session_id = ?
    LIMIT 1
  `).get(sessionId) as {
    status: string;
    token: string | null;
    plan: string | null;
    delivery_sent_at: string | null;
    customer_email: string | null;
  } | undefined;

  if (!row) {
    return { status: "processing" as const };
  }

  if (!row.token) {
    return { status: "processing" as const };
  }

  return {
    status: "ready" as const,
    token: row.token,
    plan: row.plan ?? "pro",
    customerEmail: row.customer_email ?? "",
    emailSent: Boolean(row.delivery_sent_at)
  };
};
