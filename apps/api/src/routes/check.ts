import { Router } from "express";
import { env } from "../config/env.js";
import type { CheckRequestPayload, CheckTextService, LicenseAccount } from "../types.js";

const normalizeLanguage = (language: string | undefined) => {
  return language?.trim() || "pt-BR";
};

export const createCheckRouter = (checkText: CheckTextService) => {
  const router = Router();

  router.post("/api/check", async (request, response) => {
    const body = request.body as CheckRequestPayload | undefined;
    const text = body?.text;
    const language = normalizeLanguage(body?.language);
    const license = response.locals.license as LicenseAccount | undefined;
    const maxTextLength = license?.maxTextLength ?? env.maxTextLength;

    if (typeof text !== "string" || !text.trim()) {
      response.status(400).json({ error: "Text is required" });
      return;
    }

    if (text.length > maxTextLength) {
      response.status(413).json({ error: `Text exceeds limit of ${maxTextLength} characters` });
      return;
    }

    try {
      const result = await checkText({ text, language });
      response.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown LanguageTool error";
      response.status(502).json({ error: message });
    }
  });

  return router;
};
