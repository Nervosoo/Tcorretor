import { Router } from "express";
import type { AccountResponse, LicenseAccount } from "../types.js";

export const createAccountRouter = () => {
  const router = Router();

  router.get("/api/account", (_request, response) => {
    const license = response.locals.license as LicenseAccount | undefined;

    if (!license) {
      response.status(500).json({ error: "License context unavailable" });
      return;
    }

    const payload: AccountResponse = {
      status: "ok",
      account: {
        name: license.name,
        plan: license.plan,
        maxTextLength: license.maxTextLength,
        commercialUse: license.commercialUse
      }
    };

    response.json(payload);
  });

  return router;
};
