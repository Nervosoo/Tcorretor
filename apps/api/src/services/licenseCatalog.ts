import { env } from "../config/env.js";
import { findLicenseAccountByToken } from "./billingRepository.js";
import type { LicenseAccount } from "../types.js";

const fallbackCatalog: LicenseAccount[] = [
  {
    token: env.apiKey,
    name: "Conta local",
    plan: "pro",
    maxTextLength: env.maxTextLength,
    commercialUse: true
  }
];

const parseCatalog = (rawCatalog: string | undefined): LicenseAccount[] => {
  if (!rawCatalog) {
    return fallbackCatalog;
  }

  try {
    const parsed = JSON.parse(rawCatalog) as Array<Partial<LicenseAccount>>;
    const normalized = parsed
      .filter((entry) => typeof entry.token === "string" && entry.token.trim())
      .map((entry) => ({
        token: entry.token!.trim(),
        name: entry.name?.trim() || "Conta sem nome",
        plan: entry.plan?.trim() || "starter",
        maxTextLength: Number.isFinite(entry.maxTextLength) ? Number(entry.maxTextLength) : env.maxTextLength,
        commercialUse: entry.commercialUse ?? true
      }));

    return normalized.length > 0 ? normalized : fallbackCatalog;
  } catch {
    return fallbackCatalog;
  }
};

const licenseCatalog = parseCatalog(process.env.LICENSE_CATALOG);
const licenseMap = new Map(licenseCatalog.map((license) => [license.token, license]));

export const resolveLicense = (token: string) => {
  const storedLicense = findLicenseAccountByToken(token);
  if (storedLicense) {
    return storedLicense;
  }

  return licenseMap.get(token) ?? null;
};

export const listLicenses = () => {
  return licenseCatalog;
};
