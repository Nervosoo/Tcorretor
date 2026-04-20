import { applyReplacement } from "../apply/applyReplacement";

const placeCursorAtOffset = (element: HTMLElement, offset: number) => {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let currentOffset = 0;
  let currentNode = walker.nextNode();

  while (currentNode) {
    const textLength = currentNode.textContent?.length ?? 0;
    if (currentOffset + textLength >= offset) {
      const range = document.createRange();
      range.setStart(currentNode, Math.max(0, offset - currentOffset));
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }

    currentOffset += textLength;
    currentNode = walker.nextNode();
  }

  const fallbackRange = document.createRange();
  fallbackRange.selectNodeContents(element);
  fallbackRange.collapse(false);
  selection.removeAllRanges();
  selection.addRange(fallbackRange);
};

export class ContentEditableAdapter {
  constructor(private readonly element: HTMLElement) {}

  getText() {
    return this.element.innerText || this.element.textContent || "";
  }

  replace(offset: number, length: number, replacement: string) {
    const next = applyReplacement(this.getText(), offset, length, replacement);
    this.element.textContent = next.text;
    placeCursorAtOffset(this.element, next.caretOffset);
    this.element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  focus() {
    this.element.focus();
  }

  getAnchor() {
    return this.element;
  }
}
