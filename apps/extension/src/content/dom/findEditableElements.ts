export type SupportedEditable = HTMLInputElement | HTMLTextAreaElement | HTMLElement;

const supportedInputTypes = new Set(["", "text", "search", "email", "url", "tel"]);
const editableSelector = [
  "textarea",
  "input",
  "[contenteditable]",
  "[role='textbox']"
].join(", ");

export const getEditableElementFromTarget = (target: EventTarget | null): SupportedEditable | null => {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const element = target.closest(editableSelector);

  if (!(element instanceof HTMLElement)) {
    return null;
  }

  if (element instanceof HTMLTextAreaElement) {
    return element.disabled || element.readOnly ? null : element;
  }

  if (element instanceof HTMLInputElement) {
    const normalizedType = (element.getAttribute("type") ?? "text").toLowerCase();
    return element.disabled || element.readOnly || !supportedInputTypes.has(normalizedType) ? null : element;
  }

  return element.isContentEditable || element.getAttribute("role") === "textbox" ? element : null;
};
