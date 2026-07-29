# PROJECT.md — RydeePortalWebsite

> **Last updated:** 2026-07-29 · Snapshot, not a log — rewrite stale sections.

---

## Overview

RydeePortalWebsite is a single-page React portal for the Rydee ride-hailing platform (DBX8 / MEU-FQA). It serves three active roles (Rider, Admin, Operator) with role-scoped dashboards and rider management screens. Stack: **React 18 + Vite 6 + TypeScript + Tailwind CSS 4 + shadcn/ui**, routing via **react-router 7** (library/browser mode), mock API via **MSW 2.x** (flag-gated), package manager **npm**. The backend is WIP elsewhere at `localhost:3000`; the API contract is frozen at `POST /user/login` (`{ phone, password }`) and `POST /register/user` (`{ name, email, phoneNumber, dob, address, password, role }`), `credentials: "include"`.

---

## Current State (as of 2026-07-29)

The repo completed a full architect-designed, QA-gated restructure (C0–C7) plus two post-ship increments. All three ADRs are **Accepted**. Session persistence (D9 client-side scope) is **closed**. The app builds clean, passes all gates, and runs fully offline behind the MSW mock.

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
| `.env` removed from git | ✅ Done — **🔑 Google Maps key rotation still pending user action (dandkhan)** |

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
| `strict: false` retained | `typecheck:strict` runs clean; flip blocked only by two suppressions in D6 | [strict-errors.md](design/strict-errors.md) |
| API contract frozen (H1) | Field names, `credentials:include`, endpoint paths locked; MSW handlers are the living contract | ADR-0003 |
| AGENTS.md is canonical contributor rules | H1–H8 hard rules bind all contributors and AI coding tools | [AGENTS.md](../AGENTS.md) |

---

## QA History

### C5 Review (2026-07-29)

| Finding | Sev | Resolution |
|---------|-----|------------|
| **F1** — Infinite redirect loop for unknown/Customer roles | BLOCKER | ✅ Fixed `8c22e86`: `PublicOnly` detects `roleHome === "/login"` → `logout()` in effect + renders `<Outlet/>` |
| **F2** — `Admin` added to self-service ROLES | MAJOR | ✅ Fixed `8c22e86`: ROLES reverted to `["Operator","Customer","Rider"]`; product question → D14 |
| **F3** — Operator "Active/Pending Riders" buttons were silent no-ops | MAJOR | ✅ Fixed `884a0a4`: guard widened to `allow=["Admin","Operator"]` per user Option A |
| **F4** — `login()` role-overwrite (silent contract change) | Minor | ⏳ Deferred → D15 |
| **F5** — Post-register `navigate` pushes history | Minor | ⏳ Deferred → D16 |

### C6/C7 Release Readiness (2026-07-29)

| Finding | Sev | Resolution |
|---------|-----|------------|
| **F6** — MSW login handler matched `email` but app sends `phone` → always 401 | BLOCKER | ✅ Fixed `c649bd8`: handler predicate + seeds updated to `phone`; ADR-0003 contract table amended |
| **F7** — ADR-0003 listed `{ email, password }` for login request | Major (doc) | ✅ Fixed `c649bd8` (same commit) |
| **F8** — README seed table used email addresses | Minor | ✅ Fixed `c649bd8` + `6a04f71` |

**Final C6/C7 verdict:** ✅ SHIP — gates: lint 0e/14w · typecheck 0 · typecheck:strict 0 · build 595.16 kB / 168.15 kB gzip · `rg msw dist/assets/` = 0 hits.

### D9 Session Persistence (2026-07-29)

**Verdict:** ✅ SHIP 11/11 assertions pass. F1 loop stays broken across refreshes (Customer envelope rehydrated → `PublicOnly.useEffect(logout)` → key cleared → no re-loop). TTL, corrupt-envelope, and version-mismatch paths all clear storage and return `null`. Residuals I1–I5 logged under D17 (non-blocking).

---

## Open Items — Deferred Work Register

| ID | Item | Owner |
|----|------|-------|
| D1 | DOB input uses `type="number"` | Frontend Dev |
| D2 | Invalid `autoComplete` attribute values | Frontend Dev |
| D3 | `Boolean` (object type) in `Profile` interface | Frontend Dev |
| D4 | `RiderDashboard.tsx` self-import (`NavigateParams`) | Frontend Dev |
| D5 | `ImageWithFallback.tsx` unimported — delete or adopt | Frontend Dev |
| D6 | Unify `RiderDashboard` inline `Profile` with `@/types/profile.ts`; remove `@ts-nocheck` + `@ts-expect-error`; flip `strict: true` | Frontend Dev |
| D7 | Map library consolidation (Google Maps vs Leaflet) | Architect + PM |
| D8 | Adopt `components/ui/` (shadcn) in pages — restyle iteration | Frontend Dev |
| D9 | ~~Auth session persistence~~ **CLOSED (client-side)** — localStorage v1 envelope + 24h TTL shipped `0960516`. Remainder (token-based auth, server-side revocation, `/me` rehydrate) → **D17** | — |
| D10 | Dependency audit: react-dnd, react-slick, react-responsive-masonry, canvas-confetti, react-popper, motion, recharts… | Frontend Dev |
| D11 | `Customer` role — route/home destination undefined; `roleHome` falls back to `/login` + logout | Architect + PM |
| D12 | Reuse MSW handlers in Node for vitest/Playwright test suite | QA + Frontend Dev |
| D13 | Optional git-history rewrite to purge leaked `.env` (key rotation is mandatory first) | DevOps / PM |
| D14 | **Product question:** should `Admin` be creatable via `/admin/register`? (ROLES revert was F2 fix; if yes: widen ROLES, add audit log, confirm backend accept-list) | PM + Product |
| D15 | `AuthProvider.login()` overwrites `profile.role` with top-level `data.role` — normalize at boundary | Frontend Dev |
| D16 | Post-register `navigate("/login")` should use `{ replace: true }` | Frontend Dev |
| D17 | Token-based auth + server-side revocation + `/me` rehydrate (D9 remainder) — future ADR, backend contract pending. Residuals from D9 QA: I1 silent quota swallow, I2 cross-tab logout, I3 TTL check-on-load only, I4 PublicOnly one-render stale profile, I5 idle-timer | Backend + Frontend Dev |
| — | **🔑 Google Maps API key rotation** — key was in git history; new key + HTTP-referrer restriction required. **Pending user action (dandkhan) in Google Cloud Console.** | **User (dandkhan)** |
| — | `npm audit` advisories — review after D10 dep audit | Frontend Dev |
| — | Bundle-size warning — track gzip within ±2% of 168.15 kB baseline | Frontend Dev |
| — | Router react-refresh lint warnings (7, T-C5-4) — split route adapters to `src/features/*/route.tsx` | Frontend Dev |

---

## Conventions

| Convention | Detail |
|-----------|--------|
| Commit style | `chore/refactor/feat/fix/docs(scope): description`; every commit ends with all gates green |
| Quality gates | `npm run lint` (0 errors) · `npm run typecheck` (0 errors) · `npm run build` — required before merging; `typecheck:strict` non-blocking in CI |
| CI | GitHub Actions (`.github/workflows/ci.yml`) — Node 20, `npm ci` cache, push/PR |
| ADRs | `docs/adr/NNNN-slug.md` — Proposed → Accepted/Rejected/Superseded; update in same commit as any shape change |
| AGENTS.md hard rules | **H1–H8 bind all contributors and AI coding tools.** Key rules: H1 API contract frozen, H2 never widen ROLES, H3 never delete Customer seed, H4 don't edit `components/ui/`, H5 never commit `.env`, H6 handlers import URLs from `lib/config.ts`, H7 auth storage only via `session.ts`, H8 guard changes require tracing PublicOnly + ProtectedRoute |
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
| Migration Plan (C0–C7 + deferred register D1–D17) | `docs/design/migration-plan.md` |
| TypeScript Strict Mode Baseline | `docs/design/strict-errors.md` |
| QA C5 Review | `docs/qa/c5-review.md` |
| QA C6/C7 + D9 Release Readiness | `docs/qa/release-readiness.md` |
| MSW Developer Guide (seeds, contract, troubleshooting) | `src/mocks/README.md` |
