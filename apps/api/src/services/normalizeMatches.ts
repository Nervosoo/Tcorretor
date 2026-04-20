import type { CheckResponse, LanguageToolPayload, NormalizedMatch } from "../types.js";

const normalizeMatch = (match: NonNullable<LanguageToolPayload["matches"]>[number]): NormalizedMatch => {
  return {
    id: match.rule?.id ?? "UNKNOWN_RULE",
    message: match.message,
    shortMessage: match.shortMessage ?? "",
    offset: match.offset,
    length: match.length,
    category: match.rule?.category?.name ?? "General",
    replacements: (match.replacements ?? []).map((replacement) => replacement.value).filter(Boolean)
  };
};

export const normalizeMatches = (payload: LanguageToolPayload, language: string, textLength: number): CheckResponse => {
  return {
    language: payload.language?.code ?? language,
    textLength,
    matches: (payload.matches ?? []).map(normalizeMatch)
  };
};
