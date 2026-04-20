import { applyReplacement } from "../apply/applyReplacement";

export class TextInputAdapter {
  constructor(private readonly element: HTMLInputElement | HTMLTextAreaElement) {}

  getText() {
    return this.element.value;
  }

  replace(offset: number, length: number, replacement: string) {
    const next = applyReplacement(this.element.value, offset, length, replacement);
    this.element.value = next.text;
    this.element.setSelectionRange(next.caretOffset, next.caretOffset);
    this.element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  focus() {
    this.element.focus();
  }

  getAnchor() {
    return this.element;
  }
}
