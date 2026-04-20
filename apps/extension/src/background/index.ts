import { callCheckApi, pingApi } from "../lib/api";
import type { BackgroundMessage, BackgroundResponse, CheckResponse } from "../lib/types";

const sendAsyncResponse = <T>(
  handler: () => Promise<T>,
  sendResponse: (response: BackgroundResponse<T>) => void
) => {
  void handler()
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Erro inesperado";
      sendResponse({ ok: false, error: message });
    });
};

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
  if (message.type === "CHECK_TEXT") {
    sendAsyncResponse<CheckResponse>(() => {
      return callCheckApi(
        message.payload.settings,
        message.payload.text,
        message.payload.language
      );
    }, sendResponse);

    return true;
  }

  if (message.type === "PING_API") {
    sendAsyncResponse(() => pingApi(message.payload.settings), sendResponse);
    return true;
  }

  return false;
});
