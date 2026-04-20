export type NormalizedMatch = {
  id: string;
  message: string;
  shortMessage: string;
  offset: number;
  length: number;
  category: string;
  replacements: string[];
};

export type CheckResponse = {
  language: string;
  textLength: number;
  matches: NormalizedMatch[];
};

export type LicenseAccount = {
  token: string;
  name: string;
  plan: string;
  maxTextLength: number;
  commercialUse: boolean;
};

export type AccountResponse = {
  status: "ok";
  account: Omit<LicenseAccount, "token">;
};

export type LanguageToolReplacement = {
  value: string;
};

export type LanguageToolMatch = {
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
};

export type LanguageToolPayload = {
  matches?: LanguageToolMatch[];
  language?: {
    code?: string;
  };
};

export type CheckRequestPayload = {
  text: string;
  language?: string;
};

export type CheckTextInput = {
  text: string;
  language: string;
};

export type CheckTextService = (input: CheckTextInput) => Promise<CheckResponse>;
