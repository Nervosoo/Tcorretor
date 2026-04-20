import type { ExtensionSettings } from "./types";

const defaultApiBaseUrl = import.meta.env.VITE_DEFAULT_API_BASE_URL ?? "http://localhost:3001";

export const defaultSettings: ExtensionSettings = {
  serviceMode: "private",
  apiBaseUrl: defaultApiBaseUrl,
  apiKey: "dev-token",
  language: "pt-BR",
  disabledDomains: []
};

const SETTINGS_KEY = "settings";

export const getSettings = async (): Promise<ExtensionSettings> => {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return {
    ...defaultSettings,
    ...(result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined)
  };
};

export const saveSettings = async (next: Partial<ExtensionSettings>) => {
  const current = await getSettings();
  const merged = { ...current, ...next };
  await chrome.storage.local.set({ [SETTINGS_KEY]: merged });
  return merged;
};

export const toggleDomain = async (domain: string) => {
  const settings = await getSettings();
  const disabledDomains = settings.disabledDomains.includes(domain)
    ? settings.disabledDomains.filter((item) => item !== domain)
    : [...settings.disabledDomains, domain].sort();

  return saveSettings({ disabledDomains });
};

export const isDomainDisabled = (settings: ExtensionSettings, domain: string) => {
  return settings.disabledDomains.includes(domain);
};
