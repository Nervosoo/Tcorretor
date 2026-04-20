# Billing Stripe Licenses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stripe checkout, webhook processing, SQLite persistence, and automatic license generation for the private API mode.

**Architecture:** The backend exposes public billing endpoints for Stripe checkout and webhook handling, persists customers/subscriptions/licenses in SQLite, and validates license tokens on private extension calls. The extension stays simple and uses the issued token as its commercial credential.

**Tech Stack:** TypeScript, Express, Stripe SDK, node:sqlite, React, Vite

---

### Task 1: Billing Data Layer

**Files:**
- Create: `apps/api/src/db/sqlite.ts`
- Create: `apps/api/src/services/billingRepository.ts`
- Modify: `apps/api/src/config/env.ts`

- [ ] Create SQLite schema for customers, subscriptions and licenses
- [ ] Add repository functions to upsert customer/subscription and resolve license tokens

### Task 2: Stripe Integration

**Files:**
- Create: `apps/api/src/services/stripeBilling.ts`
- Create: `apps/api/src/routes/billing.ts`

- [ ] Create checkout session endpoint
- [ ] Validate webhook signature
- [ ] Sync Stripe subscription state to SQLite
- [ ] Generate license automatically after confirmed checkout

### Task 3: License Validation

**Files:**
- Modify: `apps/api/src/services/licenseCatalog.ts`
- Modify: `apps/api/src/middleware/apiKeyAuth.ts`
- Modify: `apps/api/src/routes/check.ts`
- Create: `apps/api/src/routes/account.ts`

- [ ] Resolve active license from SQLite
- [ ] Expose account/plan endpoint for the extension
- [ ] Enforce text limit by plan

### Task 4: Extension Commercial Readiness

**Files:**
- Modify: `apps/extension/src/content/index.ts`
- Modify: `apps/extension/src/content/checking/CheckScheduler.ts`
- Modify: `apps/extension/src/lib/api.ts`
- Modify: `apps/extension/src/lib/types.ts`
- Modify: `apps/extension/src/options/App.tsx`
- Modify: `apps/extension/src/popup/App.tsx`

- [ ] Speed up checks with adaptive debounce and cache
- [ ] Show account plan in popup when using private mode
- [ ] Rename private token field to license token

### Task 5: Verification

**Files:**
- Modify: `apps/api/tests/check.test.ts`
- Modify: `README.md`

- [ ] Keep API tests passing
- [ ] Validate workspace build
- [ ] Document billing environment variables and routes
