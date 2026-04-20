import type { RequestHandler } from "express";
import type { LicenseAccount } from "../types.js";

type LicenseResolver = (token: string) => LicenseAccount | null;

export const createApiKeyAuth = (resolveLicense: LicenseResolver): RequestHandler => {
  return (request, response, next) => {
    const authorization = request.header("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      response.status(401).json({ error: "Missing bearer token" });
      return;
    }

    const token = authorization.slice("Bearer ".length).trim();
    const license = resolveLicense(token);

    if (!license) {
      response.status(403).json({ error: "Invalid bearer token" });
      return;
    }

    response.locals.license = license;

    next();
  };
};
