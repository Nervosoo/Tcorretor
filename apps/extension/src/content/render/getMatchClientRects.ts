type MatchClientRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const copiedStyleProperties = [
  "box-sizing",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-variant",
  "font-stretch",
  "line-height",
  "letter-spacing",
  "text-transform",
  "text-align",
  "text-indent",
  "text-rendering",
  "text-decoration",
  "text-shadow",
  "tab-size",
  "word-spacing",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "overflow-wrap",
  "word-break"
];

const toRects = (rectList: DOMRectList | DOMRect[]): MatchClientRect[] => {
  return Array.from(rectList)
    .filter((rect) => rect.width > 0 || rect.height > 0)
    .map((rect) => ({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    }));
};

const getNodeOffset = (root: HTMLElement, targetOffset: number) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let consumed = 0;
  let currentNode = walker.nextNode();
  let lastTextNode: Node | null = null;

  while (currentNode) {
    const textLength = currentNode.textContent?.length ?? 0;
    lastTextNode = currentNode;

    if (consumed + textLength >= targetOffset) {
      return {
        node: currentNode,
        offset: Math.max(0, targetOffset - consumed)
      };
    }

    consumed += textLength;
    currentNode = walker.nextNode();
  }

  if (!lastTextNode) {
    return null;
  }

  return {
    node: lastTextNode,
    offset: lastTextNode.textContent?.length ?? 0
  };
};

const getContentEditableRects = (element: HTMLElement, offset: number, length: number) => {
  const start = getNodeOffset(element, offset);
  const end = getNodeOffset(element, offset + length);

  if (!start || !end) {
    return [];
  }

  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);

  return toRects(range.getClientRects());
};

const getTextControlRects = (element: HTMLInputElement | HTMLTextAreaElement, text: string, offset: number, length: number) => {
  const rect = element.getBoundingClientRect();
  const computed = window.getComputedStyle(element);
  const mirror = document.createElement("div");
  const marker = document.createElement("span");

  mirror.setAttribute("aria-hidden", "true");
  mirror.style.position = "fixed";
  mirror.style.left = `${rect.left}px`;
  mirror.style.top = `${rect.top}px`;
  mirror.style.width = `${rect.width}px`;
  mirror.style.height = `${rect.height}px`;
  mirror.style.visibility = "hidden";
  mirror.style.pointerEvents = "none";
  mirror.style.overflow = "hidden";
  mirror.style.background = "transparent";
  mirror.style.color = "transparent";
  mirror.style.borderColor = "transparent";
  mirror.style.whiteSpace = element instanceof HTMLTextAreaElement ? "pre-wrap" : "pre";

  for (const property of copiedStyleProperties) {
    mirror.style.setProperty(property, computed.getPropertyValue(property));
  }

  const before = document.createTextNode(text.slice(0, offset));
  const content = text.slice(offset, offset + length) || "\u200b";
  const after = document.createTextNode(text.slice(offset + length));

  marker.textContent = content;
  marker.style.background = "transparent";
  marker.style.color = "transparent";

  mirror.append(before, marker, after);
  document.body.appendChild(mirror);
  mirror.scrollTop = element.scrollTop;
  mirror.scrollLeft = element.scrollLeft;

  const rects = toRects(marker.getClientRects());
  mirror.remove();

  return rects;
};

export const getMatchClientRects = (anchor: HTMLElement, text: string, offset: number, length: number): MatchClientRect[] => {
  if (length <= 0) {
    return [];
  }

  if (anchor instanceof HTMLInputElement || anchor instanceof HTMLTextAreaElement) {
    return getTextControlRects(anchor, text, offset, length);
  }

  return getContentEditableRects(anchor, offset, length);
};

export type { MatchClientRect };
