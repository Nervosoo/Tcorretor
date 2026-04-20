import { ContentEditableAdapter } from "./adapters/ContentEditableAdapter";
import { TextInputAdapter } from "./adapters/TextInputAdapter";
import { CheckScheduler } from "./checking/CheckScheduler";
import { getEditableElementFromTarget, type SupportedEditable } from "./dom/findEditableElements";
import { OverlayController } from "./render/OverlayController";
import type { BackgroundResponse, CheckResponse, ExtensionSettings, NormalizedMatch } from "../lib/types";

type ActiveAdapter = TextInputAdapter | ContentEditableAdapter;
type CheckReason = "focus" | "typing" | "word-end" | "paste" | "apply";

const defaultApiBaseUrl = import.meta.env.VITE_DEFAULT_API_BASE_URL ?? "http://localhost:3001";

const defaultSettings: ExtensionSettings = {
  serviceMode: "private",
  apiBaseUrl: defaultApiBaseUrl,
  apiKey: "dev-token",
  language: "pt-BR",
  disabledDomains: []
};

const SETTINGS_KEY = "settings";

const getSettings = async (): Promise<ExtensionSettings> => {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return {
    ...defaultSettings,
    ...(result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined)
  };
};

const isDomainDisabled = (settings: ExtensionSettings, domain: string) => {
  return settings.disabledDomains.includes(domain);
};

const logPrefix = "[Corretor pt-BR]";

class ExtensionController {
  private scheduler = new CheckScheduler(350);
  private overlay = new OverlayController();
  private settings: ExtensionSettings | null = null;
  private activeElement: SupportedEditable | null = null;
  private activeAdapter: ActiveAdapter | null = null;
  private cache = new Map<string, CheckResponse>();
  private latestRequestId = 0;

  async start() {
    this.settings = await getSettings();

    chrome.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName === "local" && changes.settings) {
        this.settings = await getSettings();
        this.cache.clear();
      }
    });

    document.addEventListener("focusin", this.handleFocusIn, true);
    document.addEventListener("focusout", this.handleFocusOut, true);
  }

  private findEditableFromEvent(event: FocusEvent) {
    for (const entry of event.composedPath()) {
      const element = getEditableElementFromTarget(entry);
      if (element) {
        return element;
      }
    }

    return getEditableElementFromTarget(event.target);
  }

  private handleFocusIn = (event: FocusEvent) => {
    const nextElement = this.findEditableFromEvent(event);
    if (!nextElement || !this.settings) {
      return;
    }

    const domain = window.location.hostname;
    if (isDomainDisabled(this.settings, domain)) {
      this.overlay.clear();
      return;
    }

    if (this.activeElement === nextElement) {
      return;
    }

    this.detach();
    this.activeElement = nextElement;
    this.activeAdapter = nextElement instanceof HTMLInputElement || nextElement instanceof HTMLTextAreaElement
      ? new TextInputAdapter(nextElement)
      : new ContentEditableAdapter(nextElement);

    this.activeElement.addEventListener("input", this.handleInput, true);
    this.activeElement.addEventListener("paste", this.handlePaste, true);
    this.scheduleCheck("focus");
  };

  private handleFocusOut = (event: FocusEvent) => {
    if (!this.activeElement) {
      return;
    }

    const relatedTarget = event.relatedTarget;
    if (this.overlay.containsTarget(relatedTarget)) {
      return;
    }

    if (relatedTarget instanceof Node && this.activeElement.contains(relatedTarget)) {
      return;
    }

    window.setTimeout(() => {
      if (document.activeElement !== this.activeElement) {
        this.overlay.clear();
      }
    }, 120);
  };

  private handleInput = (event: Event) => {
    const inputEvent = event instanceof InputEvent ? event : null;
    const inputType = inputEvent?.inputType ?? "";
    const text = this.activeAdapter?.getText() ?? "";
    const lastCharacter = text.at(-1) ?? "";

    if (inputType.includes("paste")) {
      this.scheduleCheck("paste");
      return;
    }

    if (inputType === "insertParagraph" || inputType === "insertLineBreak") {
      this.scheduleCheck("word-end");
      return;
    }

    if (/\s|[.,!?;:]/.test(lastCharacter)) {
      this.scheduleCheck("word-end");
      return;
    }

    this.scheduleCheck("typing");
  };

  private handlePaste = () => {
    this.scheduleCheck("paste");
  };

  private scheduleCheck(reason: CheckReason) {
    if (!this.activeAdapter || !this.settings) {
      return;
    }

    const text = this.activeAdapter.getText();
    if (!text.trim()) {
      this.overlay.clear();
      return;
    }

    if (text.length > 4000) {
      this.overlay.showStatus(this.activeAdapter.getAnchor(), "Texto muito grande", "error", 2200);
      return;
    }

    const requestId = ++this.latestRequestId;
    const cacheKey = this.createCacheKey(text);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      if (cached.matches.length === 0) {
        this.overlay.clear();
      } else {
        this.overlay.update(this.activeAdapter.getAnchor(), text, cached.matches, this.applySuggestion);
      }
      return;
    }

    const runCheck = async (signal: AbortSignal) => {
      if (!this.activeAdapter || !this.settings) {
        return;
      }

      if (signal.aborted) {
        return;
      }

      const response = (await chrome.runtime.sendMessage({
        type: "CHECK_TEXT",
        payload: {
          text,
          language: this.settings!.language,
          settings: this.settings!
        }
      })) as BackgroundResponse<CheckResponse>;

      if (signal.aborted || requestId !== this.latestRequestId || !this.activeAdapter) {
        return;
      }

      if (!response.ok || !response.data) {
        console.warn(logPrefix, response.error ?? "Falha ao revisar texto", window.location.href);
        this.overlay.showStatus(this.activeAdapter.getAnchor(), response.error ?? "Falha na revisao", "error", 3000);
        return;
      }

      this.rememberCache(cacheKey, response.data);

      if (response.data.matches.length === 0) {
        this.overlay.clear();
        return;
      }

      console.info(logPrefix, `${response.data.matches.length} sugestao(oes) encontradas`, window.location.href);
      this.overlay.update(this.activeAdapter.getAnchor(), text, response.data.matches, this.applySuggestion);
    };

    const delayMs = this.getDelayForReason(reason, text);
    if (delayMs === 0) {
      this.scheduler.flush(runCheck);
      return;
    }

    this.scheduler.schedule(runCheck, delayMs);
  }

  private applySuggestion = (match: NormalizedMatch, replacement: string) => {
    if (!this.activeAdapter) {
      return;
    }

    this.activeAdapter.replace(match.offset, match.length, replacement);
    this.activeAdapter.focus();
    this.scheduleCheck("apply");
  };

  private detach() {
    this.scheduler.cancel();
    if (this.activeElement) {
      this.activeElement.removeEventListener("input", this.handleInput, true);
      this.activeElement.removeEventListener("paste", this.handlePaste, true);
    }

    this.activeElement = null;
    this.activeAdapter = null;
    this.overlay.clear();
  }

  private getDelayForReason(reason: CheckReason, text: string) {
    if (reason === "focus" || reason === "paste" || reason === "apply") {
      return 0;
    }

    if (reason === "word-end") {
      return 140;
    }

    if (text.length <= 20) {
      return 220;
    }

    return 320;
  }

  private createCacheKey(text: string) {
    const settings = this.settings!;
    return [settings.serviceMode, settings.apiBaseUrl, settings.apiKey, settings.language, text].join("::");
  }

  private rememberCache(key: string, response: CheckResponse) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, response);

    if (this.cache.size > 30) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }
}

const controller = new ExtensionController();
void controller.start();
