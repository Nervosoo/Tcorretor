const parseIntWithFallback = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBooleanWithFallback = (value: string | undefined, fallback: boolean) => {
  if (!value) {
    return fallback;
  }

  return value === "1" || value.toLowerCase() === "true";
};

export const env = {
  apiPort: parseIntWithFallback(process.env.PORT ?? process.env.API_PORT, 3001),
  apiKey: process.env.API_KEY ?? "dev-token",
  dbPath: process.env.DB_PATH ?? "./data/corretor.sqlite",
  ltBaseUrl: process.env.LT_BASE_URL ?? "http://localhost:8010",
  ltTimeoutMs: parseIntWithFallback(process.env.LT_TIMEOUT_MS, 5000),
  maxTextLength: parseIntWithFallback(process.env.MAX_TEXT_LENGTH, 4000),
  billingPlanName: process.env.BILLING_PLAN_NAME ?? "pro",
  billingPriceDisplay: process.env.BILLING_PRICE_DISPLAY ?? "R$ 19,90/mês",
  billingPlanMaxTextLength: parseIntWithFallback(process.env.BILLING_PLAN_MAX_TEXT_LENGTH, 8000),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceId: process.env.STRIPE_PRICE_ID ?? "",
  checkoutSuccessUrl: process.env.CHECKOUT_SUCCESS_URL ?? "http://localhost:3001/billing/success",
  checkoutCancelUrl: process.env.CHECKOUT_CANCEL_URL ?? "http://localhost:3001/billing/cancel",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parseIntWithFallback(process.env.SMTP_PORT, 587),
  smtpSecure: parseBooleanWithFallback(process.env.SMTP_SECURE, false),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "*"
};
