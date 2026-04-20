import overlayStyles from "./overlay.css?raw";
import { getMatchClientRects, type MatchClientRect } from "./getMatchClientRects";
import type { NormalizedMatch } from "../../lib/types";

const STYLE_ID = "corretor-overlay-style";

const ensureStyles = () => {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = overlayStyles;
  document.documentElement.appendChild(style);
};

type MatchApplyHandler = (match: NormalizedMatch, replacement: string) => void;
type StatusTone = "info" | "success" | "warning" | "error";

type MarkerEntry = {
  element: HTMLButtonElement;
  match: NormalizedMatch;
  rect: MatchClientRect;
};

export class OverlayController {
  private badge = document.createElement("button");
  private markerLayer = document.createElement("div");
  private panel = document.createElement("div");
  private currentAnchor: HTMLElement | null = null;
  private currentText = "";
  private currentMatches: NormalizedMatch[] = [];
  private onApply: MatchApplyHandler = () => undefined;
  private statusTimeoutId: number | undefined;
  private currentMarkers: MarkerEntry[] = [];
  private selectedMatch: NormalizedMatch | null = null;
  private selectedMarker: HTMLButtonElement | null = null;
  private panelAnchorRect: MatchClientRect | null = null;

  constructor() {
    ensureStyles();
    this.badge.className = "corretor-badge";
    this.badge.dataset.tone = "warning";
    this.badge.hidden = true;
    this.badge.addEventListener("mousedown", this.handlePointerDown);
    this.badge.addEventListener("click", () => {
      if (this.currentMatches.length === 0 || !this.currentAnchor) {
        return;
      }

      const anchorRect = this.currentAnchor.getBoundingClientRect();
      this.openPanel(this.currentMatches[0], {
        left: anchorRect.right - 12,
        top: anchorRect.top + 8,
        width: 12,
        height: Math.max(anchorRect.height, 18)
      });
    });

    this.markerLayer.className = "corretor-marker-layer";
    this.panel.className = "corretor-panel";
    this.panel.hidden = true;
    this.panel.addEventListener("mousedown", this.handlePointerDown);

    document.body.append(this.badge, this.markerLayer, this.panel);
    document.addEventListener("mousedown", this.handleDocumentPointerDown, true);
    window.addEventListener("scroll", this.reposition, true);
    window.addEventListener("resize", this.reposition);
  }

  containsTarget(target: EventTarget | null) {
    return target instanceof Node
      && (
        this.badge.contains(target)
        || this.panel.contains(target)
        || this.currentMarkers.some((marker) => marker.element.contains(target))
      );
  }

  update(anchor: HTMLElement, text: string, matches: NormalizedMatch[], onApply: MatchApplyHandler) {
    this.clearStatusTimeout();
    this.currentAnchor = anchor;
    this.currentText = text;
    this.currentMatches = matches;
    this.onApply = onApply;
    this.selectedMatch = null;
    this.selectedMarker = null;
    this.panelAnchorRect = null;
    this.badge.hidden = true;
    this.panel.hidden = true;
    this.panel.replaceChildren();
    this.renderMarkers();

    if (matches.length === 0) {
      this.clear();
      return;
    }

    if (this.currentMarkers.length === 0) {
      this.badge.hidden = false;
      this.badge.dataset.tone = "warning";
      this.badge.textContent = "";
      this.badge.title = `${matches.length} problema${matches.length > 1 ? "s" : ""}. Clique para ver as sugestoes.`;
      this.badge.setAttribute("aria-label", this.badge.title);
      this.positionBadge();
    }
  }

  showStatus(anchor: HTMLElement, text: string, tone: StatusTone, autoHideMs = 0) {
    this.clearStatusTimeout();
    this.clearMarkers();
    this.currentAnchor = anchor;
    this.currentText = "";
    this.currentMatches = [];
    this.selectedMatch = null;
    this.selectedMarker = null;
    this.panelAnchorRect = null;
    this.badge.hidden = false;
    this.badge.dataset.tone = tone;
    this.badge.textContent = "";
    this.badge.title = text;
    this.badge.setAttribute("aria-label", text);
    this.panel.hidden = true;
    this.panel.replaceChildren();
    this.positionBadge();

    if (autoHideMs > 0) {
      this.statusTimeoutId = window.setTimeout(() => {
        if (this.currentMatches.length === 0) {
          this.clear();
        }
      }, autoHideMs);
    }
  }

  clear() {
    this.clearStatusTimeout();
    this.clearMarkers();
    this.currentAnchor = null;
    this.currentText = "";
    this.currentMatches = [];
    this.selectedMatch = null;
    this.selectedMarker = null;
    this.panelAnchorRect = null;
    this.badge.hidden = true;
    this.badge.title = "";
    this.badge.setAttribute("aria-label", "");
    this.panel.hidden = true;
    this.panel.replaceChildren();
  }

  destroy() {
    this.clear();
    this.badge.removeEventListener("mousedown", this.handlePointerDown);
    this.panel.removeEventListener("mousedown", this.handlePointerDown);
    document.removeEventListener("mousedown", this.handleDocumentPointerDown, true);
    this.badge.remove();
    this.markerLayer.remove();
    this.panel.remove();
    window.removeEventListener("scroll", this.reposition, true);
    window.removeEventListener("resize", this.reposition);
  }

  private renderPanel(match: NormalizedMatch) {
    const excerpt = this.currentText.slice(match.offset, match.offset + match.length).trim() || this.currentText.slice(match.offset, match.offset + match.length);
    const title = document.createElement("p");
    title.className = "corretor-panel-header";
    title.textContent = "Sugestoes";

    const context = document.createElement("p");
    context.className = "corretor-context";
    context.textContent = excerpt ? `Trecho: \"${excerpt}\"` : "Trecho selecionado";

    const item = document.createElement("section");
    item.className = "corretor-match";

    const heading = document.createElement("p");
    heading.className = "corretor-match-title";
    heading.textContent = match.message;

    const meta = document.createElement("p");
    meta.className = "corretor-match-meta";
    meta.textContent = `${match.category} · Regra ${match.id}`;

    item.append(heading, meta);

    if (match.replacements.length === 0) {
      const empty = document.createElement("p");
      empty.className = "corretor-empty";
      empty.textContent = "Sem sugestoes automaticas para este caso.";
      item.append(empty);
    } else {
      const actions = document.createElement("div");
      actions.className = "corretor-actions";

      for (const replacement of match.replacements.slice(0, 4)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "corretor-action";
        button.textContent = replacement;
        button.addEventListener("click", () => {
          this.onApply(match, replacement);
          this.closePanel();
        });
        actions.append(button);
      }

      item.append(actions);
    }

    this.panel.replaceChildren(title, context, item);
  }

  private renderMarkers() {
    this.clearMarkers();

    if (!this.currentAnchor || this.currentMatches.length === 0) {
      return;
    }

    for (const match of this.currentMatches) {
      const rects = getMatchClientRects(this.currentAnchor, this.currentText, match.offset, match.length);

      for (const rect of rects) {
        const marker = document.createElement("button");
        marker.type = "button";
        marker.className = "corretor-marker";
        marker.style.left = `${rect.left}px`;
        marker.style.top = `${rect.top}px`;
        marker.style.width = `${Math.max(rect.width, 8)}px`;
        marker.style.height = `${Math.max(rect.height, 18)}px`;
        marker.title = "Clique para ver as sugestoes desta palavra";
        marker.setAttribute("aria-label", marker.title);
        marker.addEventListener("mousedown", this.handlePointerDown);
        marker.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.openPanel(match, rect, marker);
        });
        this.markerLayer.appendChild(marker);
        this.currentMarkers.push({ element: marker, match, rect });
      }
    }
  }

  private clearStatusTimeout() {
    if (typeof this.statusTimeoutId !== "undefined") {
      window.clearTimeout(this.statusTimeoutId);
      this.statusTimeoutId = undefined;
    }
  }

  private readonly handlePointerDown = (event: MouseEvent) => {
    event.preventDefault();
  };

  private readonly handleDocumentPointerDown = (event: MouseEvent) => {
    if (!this.containsTarget(event.target)) {
      this.closePanel();
    }
  };

  private readonly reposition = () => {
    if (this.currentMatches.length > 0) {
      const selected = this.selectedMatch;
      this.renderMarkers();

      if (selected) {
        const nextMarker = this.currentMarkers.find((marker) => marker.match === selected);
        if (nextMarker) {
          this.openPanel(selected, nextMarker.rect, nextMarker.element);
          return;
        }
      }
    }

    this.positionBadge();
    this.positionPanel();
  };

  private positionBadge() {
    if (!this.currentAnchor || this.badge.hidden) {
      return;
    }

    const rect = this.currentAnchor.getBoundingClientRect();
    this.badge.style.top = `${Math.max(8, rect.top + 8)}px`;
    this.badge.style.left = `${Math.max(8, rect.right - this.badge.offsetWidth - 8)}px`;
  }

  private positionPanel() {
    if (this.panel.hidden || !this.panelAnchorRect) {
      return;
    }

    const gap = 10;
    const panelHeight = this.panel.offsetHeight;
    const panelWidth = this.panel.offsetWidth;
    const canRenderBelow = this.panelAnchorRect.top + this.panelAnchorRect.height + gap + panelHeight <= window.innerHeight - 8;
    const top = canRenderBelow
      ? this.panelAnchorRect.top + this.panelAnchorRect.height + gap
      : Math.max(8, this.panelAnchorRect.top - panelHeight - gap);
    const left = Math.min(
      window.innerWidth - panelWidth - 8,
      Math.max(8, this.panelAnchorRect.left + (this.panelAnchorRect.width / 2) - (panelWidth / 2))
    );
    this.panel.style.top = `${Math.max(8, top)}px`;
    this.panel.style.left = `${Math.max(8, left)}px`;
  }

  private openPanel(match: NormalizedMatch, rect: MatchClientRect, marker?: HTMLButtonElement) {
    this.selectedMatch = match;
    this.panelAnchorRect = rect;

    if (this.selectedMarker && this.selectedMarker !== marker) {
      this.selectedMarker.classList.remove("is-selected");
    }

    this.selectedMarker = marker ?? null;
    this.selectedMarker?.classList.add("is-selected");

    this.renderPanel(match);
    this.panel.hidden = false;
    this.positionPanel();
  }

  private closePanel() {
    this.selectedMarker?.classList.remove("is-selected");
    this.selectedMarker = null;
    this.selectedMatch = null;
    this.panelAnchorRect = null;
    this.panel.hidden = true;
    this.panel.replaceChildren();
  }

  private clearMarkers() {
    for (const marker of this.currentMarkers) {
      marker.element.removeEventListener("mousedown", this.handlePointerDown);
      marker.element.remove();
    }

    this.currentMarkers = [];
    this.closePanel();
  }
}
