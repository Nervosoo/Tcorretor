# Corretor pt-BR Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome MV3 extension that checks pt-BR text through a private API backed by a self-hosted LanguageTool instance.

**Architecture:** The extension runs in the browser, detects supported editable fields, and sends debounced text checks to a background worker. The worker calls a private Express API, which authenticates the request, proxies it to LanguageTool, and returns normalized matches for the UI.

**Tech Stack:** TypeScript, React, Vite, Express, Docker, LanguageTool

---

### Task 1: Workspace Bootstrap

**Files:**
- Create: `package.json`
- Create: `README.md`
- Modify: `.gitignore`

- [ ] Create npm workspaces for `apps/api` and `apps/extension`
- [ ] Add root scripts for build and test
- [ ] Extend ignore rules for build artifacts

### Task 2: API Service

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/routes/check.ts`
- Create: `apps/api/src/routes/health.ts`
- Create: `apps/api/src/middleware/apiKeyAuth.ts`
- Create: `apps/api/src/services/languagetoolClient.ts`
- Create: `apps/api/src/services/normalizeMatches.ts`

- [ ] Implement Express server with `GET /health`
- [ ] Implement authenticated `POST /api/check`
- [ ] Normalize LanguageTool matches to a stable response

### Task 3: Extension Shell

**Files:**
- Create: `apps/extension/package.json`
- Create: `apps/extension/tsconfig.json`
- Create: `apps/extension/vite.config.ts`
- Create: `apps/extension/public/manifest.json`
- Create: `apps/extension/popup.html`
- Create: `apps/extension/options.html`

- [ ] Configure Vite multi-entry build for popup, options, background and content
- [ ] Add MV3 manifest and permissions

### Task 4: Core Extension Flow

**Files:**
- Create: `apps/extension/src/background/index.ts`
- Create: `apps/extension/src/content/index.ts`
- Create: `apps/extension/src/content/dom/findEditableElements.ts`
- Create: `apps/extension/src/content/checking/CheckScheduler.ts`
- Create: `apps/extension/src/lib/api.ts`
- Create: `apps/extension/src/lib/storage.ts`
- Create: `apps/extension/src/lib/types.ts`

- [ ] Detect supported fields
- [ ] Send debounced checks through background
- [ ] Handle API and network failures without breaking the page

### Task 5: UI and Suggestions

**Files:**
- Create: `apps/extension/src/popup/main.tsx`
- Create: `apps/extension/src/popup/App.tsx`
- Create: `apps/extension/src/options/main.tsx`
- Create: `apps/extension/src/options/App.tsx`
- Create: `apps/extension/src/content/render/overlay.css`

- [ ] Add popup and options screens
- [ ] Show issue indicator near the active field
- [ ] Allow applying replacements from a suggestion card

### Task 6: Local Infra and Verification

**Files:**
- Create: `docker-compose.yml`
- Create: `docker/languagetool/Dockerfile`
- Create: `apps/api/tests/check.test.ts`

- [ ] Run LanguageTool in Docker
- [ ] Verify API route with tests
- [ ] Build extension and API successfully
