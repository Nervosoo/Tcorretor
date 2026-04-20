import type { AccountStatus, CheckResponse, ExtensionSettings, NormalizedMatch } from "./types";

type LanguageToolReplacement = {
  value: string;
};

type LanguageToolPayload = {
  language?: {
    code?: string;
  };
  matches?: Array<{
    message: string;
    shortMessage?: string;
    offset: number;
    length: number;
    replacements?: LanguageToolReplacement[];
    rule?: {
      id?: string;
      category?: {
        name?: string;
      };
    };
  }>;
};

const normalizeMatches = (payload: LanguageToolPayload, language: string, textLength: number): CheckResponse => {
  const matches: NormalizedMatch[] = (payload.matches ?? []).map((match) => ({
    id: match.rule?.id ?? "UNKNOWN_RULE",
    message: match.message,
    shortMessage: match.shortMessage ?? "",
    offset: match.offset,
    length: match.length,
    category: match.rule?.category?.name ?? "General",
    replacements: (match.replacements ?? []).map((replacement) => replacement.value).filter(Boolean)
  }));

  return {
    language: payload.language?.code ?? language,
    textLength,
    matches
  };
};

const callPrivateApi = async (
  apiBaseUrl: string,
  apiKey: string,
  text: string,
  language: string,
  signal?: AbortSignal
): Promise<CheckResponse> => {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/check`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ text, language }),
    signal
  });

  const payload = (await response.json()) as { error?: string } | CheckResponse;

  if (!response.ok) {
    throw new Error("error" in payload && payload.error ? payload.error : "Falha ao consultar a API privada");
  }

  return payload as CheckResponse;
};

const callPublicApi = async (text: string, language: string, signal?: AbortSignal): Promise<CheckResponse> => {
  const params = new URLSearchParams();
  params.set("text", text);
  params.set("language", language);
  params.set("level", "picky");

  const response = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: params,
    signal
  });

  if (!response.ok) {
    throw new Error("Falha ao consultar a API publica do LanguageTool");
  }

  const payload = (await response.json()) as LanguageToolPayload;
  return normalizeMatches(payload, language, text.length);
};

export const callCheckApi = async (
  settings: ExtensionSettings,
  text: string,
  language: string,
  signal?: AbortSignal
): Promise<CheckResponse> => {
  if (settings.serviceMode === "public") {
    return callPublicApi(text, language, signal);
  }

  return callPrivateApi(settings.apiBaseUrl, settings.apiKey, text, language, signal);
};

export const pingApi = async (settings: ExtensionSettings) => {
  if (settings.serviceMode === "public") {
    return {
      status: "ok",
      detail: "Modo gratuito publico ativo"
    };
  }

  const response = await fetch(`${settings.apiBaseUrl.replace(/\/$/, "")}/api/account`, {
    headers: {
      authorization: `Bearer ${settings.apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error("API privada indisponivel");
  }

  return (await response.json()) as AccountStatus;
};
