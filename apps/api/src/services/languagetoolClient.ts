import { env } from "../config/env.js";
import type { CheckTextInput, CheckTextService, LanguageToolPayload } from "../types.js";
import { normalizeMatches } from "./normalizeMatches.js";

const buildBody = (input: CheckTextInput) => {
  const params = new URLSearchParams();
  params.set("text", input.text);
  params.set("language", input.language);
  params.set("level", "picky");
  return params;
};

export const createLanguageToolClient = (): CheckTextService => {
  return async (input) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), env.ltTimeoutMs);

    try {
      const response = await fetch(`${env.ltBaseUrl}/v2/check`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded"
        },
        body: buildBody(input),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`LanguageTool request failed with status ${response.status}`);
      }

      const payload = (await response.json()) as LanguageToolPayload;
      return normalizeMatches(payload, input.language, input.text.length);
    } finally {
      clearTimeout(timeoutId);
    }
  };
};
