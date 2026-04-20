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

export type AccountStatus = {
  status: "ok";
  account: {
    name: string;
    plan: string;
    maxTextLength: number;
    commercialUse: boolean;
  };
};

export type ServiceMode = "public" | "private";

export type ExtensionSettings = {
  serviceMode: ServiceMode;
  apiBaseUrl: string;
  apiKey: string;
  language: string;
  disabledDomains: string[];
};

export type CheckMessage = {
  type: "CHECK_TEXT";
  payload: {
    text: string;
    language: string;
    settings: ExtensionSettings;
  };
};

export type HealthMessage = {
  type: "PING_API";
  payload: {
    settings: ExtensionSettings;
  };
};

export type BackgroundMessage = CheckMessage | HealthMessage;

export type BackgroundResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};
