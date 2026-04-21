import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { env } from "../config/env.js";

type CustomerRow = {
  id: number;
  email: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

type SubscriptionRow = {
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
  created_at: string;
  updated_at: string;
};

type LicenseRow = {
  id: number;
  customer_id: number;
  subscription_id: number;
  token: string;
  status: string;
  plan: string;
  max_text_length: number;
  commercial_use: number;
  delivery_email: string | null;
  delivery_sent_at: string | null;
  created_at: string;
  updated_at: string;
  last_validated_at: string | null;
};

export type BillingStore = {
  customers: CustomerRow[];
  subscriptions: SubscriptionRow[];
  licenses: LicenseRow[];
};

const databasePath = resolve(process.cwd(), env.dbPath);
mkdirSync(dirname(databasePath), { recursive: true });

const defaultStore = (): BillingStore => ({
  customers: [],
  subscriptions: [],
  licenses: []
});

const ensureStoreFile = () => {
  if (existsSync(databasePath)) {
    return;
  }

  writeFileSync(databasePath, JSON.stringify(defaultStore(), null, 2), "utf8");
};

export const readStore = (): BillingStore => {
  ensureStoreFile();

  try {
    const raw = readFileSync(databasePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<BillingStore>;

    return {
      customers: parsed.customers ?? [],
      subscriptions: parsed.subscriptions ?? [],
      licenses: parsed.licenses ?? []
    };
  } catch {
    const fallback = defaultStore();
    writeStore(fallback);
    return fallback;
  }
};

export const writeStore = (store: BillingStore) => {
  ensureStoreFile();
  const tempPath = `${databasePath}.tmp`;
  writeFileSync(tempPath, JSON.stringify(store, null, 2), "utf8");
  renameSync(tempPath, databasePath);
};

export const nextId = (rows: Array<{ id: number }>) => {
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
};
