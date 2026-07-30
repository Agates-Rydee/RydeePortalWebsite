# PROJECT.md — RydeePortalWebsite

> **Last updated:** 2026-07-30 · Snapshot, not a log — rewrite stale sections.

---

## Overview

RydeePortalWebsite is a single-page React portal for the Rydee ride-hailing platform (DBX8 / MEU-FQA). It serves three active roles (Rider, Admin, Operator) with role-scoped dashboards and rider management screens. Stack: **React 18 + Vite 6 + TypeScript + Tailwind CSS 4 + shadcn/ui**, routing via **react-router 7** (library/browser mode), mock API via **MSW 2.x** (flag-gated), package manager **npm**. The backend is WIP elsewhere at `localhost:3000`; the API contract is frozen at `POST /user/login` (`{ phone, password }`) and `POST /register/user` (`{ name, email, phoneNumber, dob, address, password, role }`), `credentials: "include"`.

---

## Current State (as of 2026-07-30)

The repo completed a full architect-designed, QA-gated restructure (C0–C7) plus post-ship increments, a collaborator merge round (b0ef29c), and is now entering Iteration 2 — Hardening. All three ADRs are **Accepted**. Session persistence (D9 client-side scope) is **closed**. The app builds clean, passes all gates, and runs fully offline behind the MSW mock.

| Area | Status |
|------|--------|
| Folder structure (feature-based) | ✅ Done — `src/features/{auth,riders,dashboards}` + shared tier |
| Routing + auth guards | ✅ Done — `createBrowserRouter` + `AuthProvider` + `ProtectedRoute` / `PublicOnly` |
| MSW mock API | ✅ Done — `VITE_ENABLE_MSW=true` gates worker boot; phone-based seeds; prod bundle purity verified |
| Session persistence (D9 client-side) | ✅ Done — `localStorage` v1 envelope + 24h TTL via `src/features/auth/session.ts`; QA SHIP 11/11 |
| Figma Make artifacts stripped | ✅ Done |
| MUI + Emotion + maplibre removed | ✅ Done |
| Tooling (ESLint + Prettier + typecheck + CI) | ✅ Done — GitHub Actions on push/PR |
| AGENTS.md + AI assistant rules | ✅ Done — canonical rules file + CLAUDE.md / .cursor / .github stubs |
| TypeScript strict mode | 🟡 `typecheck:strict` = 0 errors; `strict: false` in tsconfig — flip blocked only by D6 |
| `.env` removed from git | ✅ Done |
| **🔑 Google Maps key rotation** | ✅ **DONE (2026-07-30, dandkhan)** — new key issued + HTTP-referrer restriction applied. D13 (git history rewrite) now optional / low-priority. |
| Collaborator merge round (b0ef29c) | ✅ Done — see below |
| Iteration 2 — Hardening | 🟡 In progress — see below |

---

## C0–C7 + Post-Ship Checkpoint Summary

| Checkpoint | Commit | Description |
|-----------|--------|-------------|
| C0 | `9dcc503` | Git & env hygiene — `.gitignore`, `.env` removed, `.env.example`, `pre-restructure` tag |
| C1 | `3aeecae` | Figma artifact strip + package rename (`rydee-portal-website`) |
| C2 | `9506ff5` | Remove unused deps: MUI, Emotion, maplibre-gl |
| C3 | `35093f5` | Tooling baseline: ESLint, Prettier, typecheck/typecheck:strict, GitHub Actions CI |
| C4 | `41d649e` | File moves only (`git mv`) — ADR-0001 target paths, `App.tsx` temporarily preserved |
| C5 | `79822f1` + `8c22e86` + `884a0a4` | Routing + auth (ADR-0002); QA F1 redirect-loop fix; F2 ROLES revert; F3 Operator guard widened |
| C6 | `40573ef` | MSW mock API (ADR-0003) — handlers, seed users, flag-gated boot |
| C7 | `5dbb12c` | Close-out — README, ADRs marked Accepted, `restructure-complete` tag |
| Post-ship | `c649bd8` | Fix MSW login contract drift: `email` → `phone` in handler predicate + seeds (QA F6 blocker) |
| Post-ship | `6a04f71` | `src/mocks/README.md` — developer guide, seed-user table, Customer/F1 warning |
| Post-ship | `0960516` | D9 CLOSED (client-side): session persistence in localStorage, versioned envelope v1, 24h TTL |
| Post-ship | `6806cb3` | AGENTS.md canonical AI/contributor rules + CLAUDE.md / .cursor / .github stubs |

---

## Collaborator Merge Round (b0ef29c — 2026-07-29)

**Origin commits merged:** `181b4a9` + `3f197d2` + `2c63f6c` (written against pre-C4 App.tsx layout) → merged as `b0ef29c` into restructured feature-folder branch.

**What was ported:**
- **Dashboard live fetch** — AdminDashboard + OperatorDashboard replaced STATS constants with live `POST /GetAll/UnregisteredRiders` call; filter `activation_status === "pending"` (case-insensitive); computed total / active / pending counters; "—" fallback while loading. Cancellation-safe (`cancelled` flag), URL from `@/lib/config` (H6), typed response, `credentials: "include"`, non-fatal catch.
- **New endpoint** — `API_GET_UNREGISTERED_RIDERS_URL` constant added to `src/lib/config.ts`; MSW handler `src/mocks/handlers/riders.ts` added (8 pending + 3 active seed riders); ADR-0003 contract-table row + footnote ² added in same commit. Three-way consistency (config → handler → ADR) confirmed.
- **RiderDashboard null-safe fix** — `profile?.currentLocation?.lat/lon` optional-chain on all 3 call sites (origin intent retained).

**What was intentionally NOT taken:**
- PendingRiders full rewrite (richer mock-driven UX with CNIC / verification docs / block-rider / area dropdown / PIN) — deferred as **D18**; rationale in merge commit.

**QA verdict:** ✅ PUSH-SAFE (`docs/qa/release-readiness.md` §Pre-Push Merge Review). Pushed to `origin/main`.

---

## Iteration 2 — Hardening (approved 2026-07-30, in progress)

Batched execution, QA-gated before each push.

| Work Item | Source | Owner | Status |
|-----------|--------|-------|--------|
| Strict mode flip (`strict: true`) | D6 | Frontend Dev | 🟡 In progress |
| Unify inline `Profile` / remove `@ts-nocheck` + `@ts-expect-error` | D6 | Frontend Dev | 🟡 In progress |
| Fix `RiderDashboard` self-import (`NavigateParams`) | D4 | Frontend Dev | 🟡 In progress |
| DOB input `type="number"` → `type="text"` / date picker | D1 | Frontend Dev | 🟡 In progress |
| Invalid `autoComplete` values | D2 | Frontend Dev | 🟡 In progress |
| `Boolean` object type in `Profile` | D3 | Frontend Dev | 🟡 In progress |
| `ImageWithFallback.tsx` delete or adopt | D5 | Frontend Dev | 🟡 In progress |
| `login()` role-overwrite normalization | D15 | Frontend Dev | 🟡 In progress |
| Post-register `navigate` → `replace: true` | D16 | Frontend Dev | 🟡 In progress |
| Router react-refresh lint-warning split (route adapters) | open item | Frontend Dev | 🟡 In progress |
| Dependency audit (react-dnd, react-slick, recharts, etc.) | D10 | Frontend Dev | 🟡 In progress |
| Test foundation — MSW handlers in Node for vitest/Playwright | D12 | QA + Frontend Dev | ✅ Done (vitest + RTL + msw/node, 44 regression tests) |

---

## Key Decisions

| Decision | Detail | ADR / Doc |
|----------|--------|-----------|
| Feature-based folder structure | `src/features/{auth,riders,dashboards}` + shared `components/lib/types/mocks`; cross-feature imports forbidden | [ADR-0001](adr/0001-target-folder-structure.md) |
| react-router 7 library mode | `createBrowserRouter`; guards as layout routes; no SSR/framework mode | [ADR-0002](adr/0002-routing-and-auth.md) |
| MSW 2.x mock API | Service-worker interception; app fetch unchanged; `VITE_ENABLE_MSW` flag; tree-shaken from prod | [ADR-0003](adr/0003-mock-api-msw.md) |
| MSW login contract: `phone` not `email` | `LoginPage` sends `{ phone, password }` — handler fixed to match (QA F6); ADR-0003 table amended | ADR-0003 fn¹ |
| QA F3 resolved Option A (user decision) | Operator allowed on `/admin/active-riders`, `/admin/pending-riders`, `/admin/riders/:riderId/location` | ADR-0002 fn¹ |
| Session persistence — localStorage v1 envelope | `{ v: 1, profile, savedAt }`, 24h TTL, versioned for future v2 bump; `session.ts` is sole read/write path (H7) | ADR-0002 |
| Customer seed = F1 regression tripwire | `phone: 0300444444` must never be deleted — only in-app way to smoke-test the unknown-role logout path | [mocks/README.md](../src/mocks/README.md) |
| shadcn/ui + Tailwind 4 kept; MUI removed | 48 `components/ui/` files preserved untouched (H4 — do not edit); adoption deferred (D8) | ADR-0001 |
| Both map libs kept (Google Maps + Leaflet) | Consolidation deferred (D7) | ADR-0001 |
| `strict: false` retained (until D6) | `typecheck:strict` runs clean; flip targeted in Iteration 2 | [strict-errors.md](design/strict-errors.md) |
| API contract frozen (H1) | Field names, `credentials:include`, endpoint paths locked; MSW handlers are the living contract | ADR-0003 |
| AGENTS.md is canonical contributor rules | H1–H8 hard rules bind all contributors and AI coding tools | [AGENTS.md](../AGENTS.md) |
| New endpoint `/GetAll/UnregisteredRiders` | `API_GET_UNREGISTERED_RIDERS_URL` in config; MSW handler + ADR-0003 row added in b0ef29c | ADR-0003 fn² |
| PendingRiders live-endpoint migration deferred | Mock-driven UX preserved; migration tracked as D18 | D18 |
| D13 (git history rewrite) — optional/low-priority | Google Maps key rotated (2026-07-30); old history purge is cosmetic only now | D13 |

---

## QA History

### C5 Review (2026-07-29)

| Finding | Sev | Resolution |
|---------|-----|------------|
| **F1** — Infinite redirect loop for unknown/Customer roles | BLOCKER | ✅ Fixed `8c22e86` |
| **F2** — `Admin` added to self-service ROLES | MAJOR | ✅ Fixed `8c22e86`; product question → D14 |
| **F3** — Operator "Active/Pending Riders" buttons were silent no-ops | MAJOR | ✅ Fixed `884a0a4` |
| **F4** — `login()` role-overwrite | Minor | ⏳ Deferred → D15 |
| **F5** — Post-register `navigate` pushes history | Minor | ⏳ Deferred → D16 |

### C6/C7 Release Readiness (2026-07-29)

| Finding | Sev | Resolution |
|---------|-----|------------|
| **F6** — MSW login handler matched `email` but app sends `phone` → always 401 | BLOCKER | ✅ Fixed `c649bd8` |
| **F7** — ADR-0003 listed `{ email, password }` for login | Major (doc) | ✅ Fixed `c649bd8` |
| **F8** — README seed table used email addresses | Minor | ✅ Fixed `c649bd8` + `6a04f71` |

**Final C6/C7 verdict:** ✅ SHIP — lint 0e/14w · typecheck 0 · typecheck:strict 0 · build 595.16 kB / 168.15 kB gzip.

### D9 Session Persistence (2026-07-29)

**Verdict:** ✅ SHIP 11/11. F1 loop stays broken across refreshes. Residuals I1–I5 → D17.

### Pre-Push Merge Review b0ef29c (2026-07-29)

**Verdict:** ✅ PUSH-SAFE. All H-rules respected, all gates green, remote intent faithfully ported, PendingRiders rewrite deferred as D18. Gates: lint 0e/14w · typecheck 0 · typecheck:strict 0 · build 597.24 kB / 168.69 kB gzip (+0.32% — within ±2% budget). See `docs/qa/release-readiness.md` §Pre-Push Merge Review.

---

## Open Items — Deferred Work Register

| ID | Item | Owner | Priority |
|----|------|-------|----------|
| D1 | DOB input uses `type="number"` | Frontend Dev | Iter 2 |
| D2 | Invalid `autoComplete` attribute values | Frontend Dev | Iter 2 |
| D3 | `Boolean` (object type) in `Profile` interface | Frontend Dev | Iter 2 |
| D4 | `RiderDashboard.tsx` self-import (`NavigateParams`) | Frontend Dev | Iter 2 |
| D5 | `ImageWithFallback.tsx` unimported — delete or adopt | Frontend Dev | Iter 2 |
| D6 | Unify `RiderDashboard` inline `Profile` with `@/types/profile.ts`; remove `@ts-nocheck` + `@ts-expect-error`; flip `strict: true` | Frontend Dev | Iter 2 |
| D7 | Map library consolidation (Google Maps vs Leaflet) | Architect + PM | Backlog |
| D8 | Adopt `components/ui/` (shadcn) in pages — restyle iteration | Frontend Dev | Backlog |
| D9 | ~~Auth session persistence~~ **CLOSED** — localStorage v1 envelope + 24h TTL shipped `0960516`. Remainder → D17 | — | Closed |
| D10 | Dependency audit: react-dnd, react-slick, react-responsive-masonry, canvas-confetti, react-popper, motion, recharts… | Frontend Dev | Iter 2 |
| D11 | `Customer` role — route/home destination undefined; `roleHome` falls back to `/login` + logout | Architect + PM | Backlog |
| D12 | Reuse MSW handlers in Node for vitest/Playwright test suite | QA + Frontend Dev | Iter 2 |
| D13 | ~~Optional git-history rewrite to purge leaked `.env`~~ — **optional / low-priority** (key rotated 2026-07-30; old history cosmetic only) | DevOps / PM | Low / Optional |
| D14 | **Product question:** should `Admin` be creatable via `/admin/register`? | PM + Product | Backlog |
| D15 | `AuthProvider.login()` overwrites `profile.role` with top-level `data.role` — normalize at boundary | Frontend Dev | Iter 2 |
| D16 | Post-register `navigate("/login")` should use `{ replace: true }` | Frontend Dev | Iter 2 |
| D17 | Token-based auth + server-side revocation + `/me` rehydrate (D9 remainder) — future ADR, backend contract pending | Backend + Frontend Dev | Backlog |
| D18 | PendingRiders live-endpoint migration (`POST /GetAll/UnregisteredRiders`) — mock-driven UX preserved; migrate when backend ready | Frontend Dev | Backlog |
| — | `npm audit` advisories — review after D10 dep audit | Frontend Dev | Iter 2 |
| — | Bundle-size warning — track gzip within ±2% of 168.15 kB baseline | Frontend Dev | Ongoing |
| — | Router react-refresh lint warnings (7, T-C5-4) — split route adapters to `src/features/*/route.tsx` | Frontend Dev | Iter 2 |

---

## Conventions

| Convention | Detail |
|-----------|--------|
| Commit style | `chore/refactor/feat/fix/docs(scope): description`; every commit ends with all gates green |
| Quality gates | `npm run lint` (0 errors) · `npm run typecheck` (0 errors) · `npm run build` — required before merging; `typecheck:strict` non-blocking in CI |
| CI | GitHub Actions (`.github/workflows/ci.yml`) — Node 20, `npm ci` cache, push/PR |
| ADRs | `docs/adr/NNNN-slug.md` — Proposed → Accepted/Rejected/Superseded; update in same commit as any shape change |
| AGENTS.md hard rules | **H1–H8 bind all contributors and AI coding tools.** H1 API contract frozen, H2 never widen ROLES, H3 never delete Customer seed, H4 don't edit `components/ui/`, H5 never commit `.env`, H6 handlers import URLs from `lib/config.ts`, H7 auth storage only via `session.ts`, H8 guard changes require tracing PublicOnly + ProtectedRoute |
| Package manager | **npm** — `pnpm-workspace.yaml` was a Figma artifact, deleted |
| Mock toggle | `VITE_ENABLE_MSW=true` in `.env` for offline dev; omit/`false` when pointing at real backend |
| Cross-feature imports | Forbidden — shared types/utils go in `src/types/` or `src/lib/` |
| Session read/write | Only via `src/features/auth/session.ts` (`loadSession`, `saveSession`, `clearSession`) — H7 |
| Rollback point | `git reset --hard pre-restructure` (tag on commit `ce4abac`) |

---

## Artifact Index

| Document | Path |
|----------|------|
| AI/contributor hard rules | `AGENTS.md` |
| ADR-0001: Feature-Based Structure | `docs/adr/0001-target-folder-structure.md` |
| ADR-0002: Routing & Auth (incl. session persistence) | `docs/adr/0002-routing-and-auth.md` |
| ADR-0003: Mock API (MSW) | `docs/adr/0003-mock-api-msw.md` |
| Migration Plan (C0–C7 + deferred register D1–D18) | `docs/design/migration-plan.md` |
| TypeScript Strict Mode Baseline | `docs/design/strict-errors.md` |
| QA C5 Review | `docs/qa/c5-review.md` |
| QA C6/C7 + D9 + Merge Review b0ef29c | `docs/qa/release-readiness.md` |
| MSW Developer Guide (seeds, contract, troubleshooting) | `src/mocks/README.md` |
