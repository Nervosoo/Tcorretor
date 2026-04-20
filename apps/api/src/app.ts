import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { createApiKeyAuth } from "./middleware/apiKeyAuth.js";
import { createAccountRouter } from "./routes/account.js";
import { createBillingRouter } from "./routes/billing.js";
import { createCheckRouter } from "./routes/check.js";
import { createHealthRouter } from "./routes/health.js";
import { createMarketingRouter } from "./routes/marketing.js";
import { resolveLicense } from "./services/licenseCatalog.js";
import { createLanguageToolClient } from "./services/languagetoolClient.js";
import type { CheckTextService } from "./types.js";

type AppDependencies = {
  checkText?: CheckTextService;
};

export const createApp = (dependencies: AppDependencies = {}) => {
  const app = express();
  const checkText = dependencies.checkText ?? createLanguageToolClient();

  app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin }));
  app.use(createMarketingRouter());
  app.use(createHealthRouter());
  app.use(createBillingRouter());
  app.use(express.json({ limit: `${env.maxTextLength + 512}b` }));
  app.use(createApiKeyAuth(resolveLicense));
  app.use(createAccountRouter());
  app.use(createCheckRouter(checkText));

  return app;
};
