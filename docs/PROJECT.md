# PROJECT.md — RydeePortalWebsite

> **Last updated:** 2026-07-29 · Snapshot, not a log — rewrite stale sections.

---

## Overview

RydeePortalWebsite is a single-page React portal for the Rydee ride-hailing platform (DBX8 / MEU-FQA). It serves three roles (Rider, Admin, Operator) with role-scoped dashboards and rider management screens. Stack: **React 18 + Vite 6 + TypeScript + Tailwind CSS 4 + shadcn/ui**, routing via **react-router 7** (library/browser mode), mock API via **MSW 2.x** (flag-gated), package manager **npm**. The backend is WIP elsewhere at `localhost:3000`; the API contract is frozen at `POST /user/login` and `POST /register/user` (`credentials: "include"`).

---

## Current State (as of `restructure-complete` tag, 2026-07-29)

The repo completed a full architect-designed, QA-gated restructure across 8 commits (C0–C7). All three ADRs are **Accepted**. The app builds clean, passes lint and typecheck, and runs fully offline behind the MSW mock.

| Area | Status |
|------|--------|
| Folder structure (feature-based) | ✅ Done — `src/features/{auth,riders,dashboards}` + shared tier |
| Routing + auth guards | ✅ Done — `createBrowserRouter` + `AuthProvider` + `ProtectedRoute` / `PublicOnly` |
| MSW mock API | ✅ Done — `VITE_ENABLE_MSW=true` gates worker boot; `public/mockServiceWorker.js` committed |
| Figma Make artifacts stripped | ✅ Done — `pnpm-workspace.yaml`, `guidelines/`, `default_shadcn_theme.css` removed |
| MUI + Emotion + maplibre removed | ✅ Done |
| Tooling (ESLint + Prettier + typecheck + CI) | ✅ Done — GitHub Actions on push/PR |
| TypeScript strict mode | 🟡 `typecheck:strict` = 0 errors; `strict: false` still in tsconfig — flip blocked only by D6 |
| `.env` removed from git | ✅ Done — `.env.example` committed; **Google Maps key rotation still pending user action** |

---

## C0–C7 Checkpoint Summary

| Checkpoint | Commit | Description |
|-----------|--------|-------------|
| C0 | `9dcc503` | Git & env hygiene — `.gitignore` expanded, `.env` removed from tracking, `.env.example` added, `pre-restructure` tag |
| C1 | `3aeecae` | Figma artifact strip + package identity (`@figma/my-make-file` → `rydee-portal-website`, `pnpm` artifacts removed) |
| C2 | `9506ff5` | Remove unused deps: `@mui/material`, `@emotion/react`, `@emotion/styled`, `maplibre-gl` |
| C3 | `35093f5` | Tooling baseline: ESLint flat config, Prettier, `typecheck` / `typecheck:strict` scripts, GitHub Actions CI |
| C4 | `41d649e` | File moves only (`git mv`) — all files to target ADR-0001 paths; `App.tsx` temporarily preserved at `src/App.tsx` |
| C5 | `79822f1` + `8c22e86` + `884a0a4` | Routing + auth (ADR-0002); QA F1 redirect-loop fix; QA F2 ROLES revert; QA F3 Operator guard widened |
| C6 | `40573ef` | MSW mock API (ADR-0003) — handlers, seed users, flag-gated boot in `main.tsx` |
| C7 | `5dbb12c` | Close-out — README updated, ADRs 0001–0003 marked Accepted, `restructure-complete` tag |

---

## Key Decisions

| Decision | Detail | ADR |
|----------|--------|-----|
| Feature-based folder structure | `src/features/{auth,riders,dashboards}` + shared `components/lib/types/mocks`; features may not import each other | [ADR-0001](adr/0001-target-folder-structure.md) |
| react-router 7 library mode | `createBrowserRouter`; guards as layout routes; framework/SSR mode rejected as overkill | [ADR-0002](adr/0002-routing-and-auth.md) |
| MSW 2.x mock API | Service-worker interception; app fetch code unchanged; `VITE_ENABLE_MSW` flag; dev-only (tree-shaken from prod) | [ADR-0003](adr/0003-mock-api-msw.md) |
| shadcn/ui + Tailwind 4 kept | 48 `components/ui/` files preserved untouched; adoption deferred (D8) | ADR-0001 |
| MUI + Emotion + maplibre removed | Zero references confirmed before removal | ADR-0001 |
| Both map libs kept (Google Maps + Leaflet) | Consolidation deferred pending product decision (D7) | ADR-0001 |
| Figma Make artifacts stripped | `pnpm-workspace.yaml`, `guidelines/`, `default_shadcn_theme.css`, `figmaAssetResolver` plugin removed | ADR-0001 |
| `strict: false` retained | `typecheck:strict` runs clean (0 errors); flip blocked only by two suppressions in D6 | [strict-errors.md](design/strict-errors.md) |
| Auth in-memory only | Refresh = logged out; session persistence deferred (D9) | ADR-0002 |
| API contract frozen | `POST /user/login` + `POST /register/user` field names / `credentials:include` locked; MSW handlers are the living contract | ADR-0003 |
| QA F3 resolved Option A (user decision) | Operator allowed on `/admin/active-riders`, `/admin/pending-riders`, `/admin/riders/:riderId/location` | ADR-0002 fn¹ |

---

## QA History — C5 Review (2026-07-29)

| Finding | Sev | Resolution |
|---------|-----|------------|
| **F1** — Infinite redirect loop for unknown/Customer roles | BLOCKER | ✅ Fixed (`8c22e86`): `PublicOnly` detects `roleHome === "/login"` → calls `logout()` in effect, renders `<Outlet/>` |
| **F2** — `Admin` added to self-service ROLES (privilege escalation surface) | MAJOR | ✅ Fixed (`8c22e86`): `ROLES` reverted to `["Operator","Customer","Rider"]`; product question logged as D14 |
| **F3** — Operator "Active/Pending Riders" buttons were silent no-ops | MAJOR | ✅ Fixed (`884a0a4`): guard widened to `allow=["Admin","Operator"]` per user Option A |
| **F4** — `login()` overwrites `profile.role` with top-level `data.role` (silent contract change) | Minor | ⏳ Deferred → D15 |
| **F5** — Post-register `navigate("/login")` pushes history; back returns stale form | Minor | ⏳ Deferred → D16 |
| F6–F13 | Minor/Info | Accepted as deferred or informational |

**Final QA verdict:** ✅ APPROVED — C6 unblocked. Gates at close: lint 0 err / 14 warn · typecheck 0 err · typecheck:strict 0 err · build 595 kB / 168.09 kB gzip.

---

## Open Items — Deferred Work Register

| ID | Item | Source | Owner |
|----|------|--------|-------|
| D1 | DOB input uses `type="number"` (should be `date` or text with validation) | Known bug | Frontend Dev |
| D2 | Invalid `autoComplete` attribute values | Known bug | Frontend Dev |
| D3 | `Boolean` (object type) in `Profile` interface | Known bug | Frontend Dev |
| D4 | `RiderDashboard.tsx` self-import (`import NavigateParams from "./RiderDashboard"`) | Survey | Frontend Dev |
| D5 | `ImageWithFallback.tsx` unimported — delete or adopt | Survey | Frontend Dev |
| D6 | Unify `RiderDashboard` inline `Profile` with `@/types/profile.ts`; remove `@ts-nocheck` + `@ts-expect-error`; flip `strict: true` | C3 baseline | Frontend Dev |
| D7 | Map library consolidation (Google Maps vs Leaflet — two libs for maps) | Design | Architect + PM |
| D8 | Adopt `components/ui/` (shadcn) in pages; restyle iteration | Design | Frontend Dev |
| D9 | Auth session persistence (`sessionStorage` rehydrate or `/me` endpoint) | ADR-0002 | Frontend Dev |
| D10 | Dependency audit: react-dnd, react-slick, react-responsive-masonry, canvas-confetti, react-popper, motion, recharts, others | Survey | Frontend Dev |
| D11 | `Customer` role — route/home destination undefined; `roleHome` currently falls back to `/login` + logout | ADR-0002 | Architect + PM |
| D12 | Reuse MSW handlers in Node for vitest/Playwright test suite | ADR-0003 | QA + Frontend Dev |
| D13 | Optional git-history rewrite to purge leaked `.env` from history (key rotation done) | C0 | DevOps / PM |
| D14 | **Product question:** should `Admin` be creatable via `/admin/register`? Currently `ROLES=["Operator","Customer","Rider"]` — revert of F2. If yes: widen ROLES, add audit log, confirm backend accept-list | QA F2 | PM + Product |
| D15 | `AuthProvider.login()` overwrites `profile.role` with top-level `data.role` — investigate backend contract, normalize at boundary | QA F4 | Frontend Dev |
| D16 | Post-register `navigate("/login")` should use `{ replace: true }` to prevent back-to-stale-form | QA F5 | Frontend Dev |
| — | **🔑 Google Maps API key rotation** — key was in git history; new key + HTTP-referrer restriction required. **Pending user action in Google Cloud Console.** | C0 step 0.5 | **User (dandkhan)** |
| — | `npm audit` advisories — review after D10 dep audit | C1 | Frontend Dev |
| — | Bundle-size warning — track gzip within ±2% of 168.09 kB baseline; investigate if it grows | QA C5 | Frontend Dev |
| — | Router-file react-refresh lint warnings (7 warnings, T-C5-4) — split route adapters to `src/features/*/route.tsx` | QA F7 | Frontend Dev |

---

## Conventions

| Convention | Detail |
|-----------|--------|
| Commit style | Checkpoint commits: `chore/refactor/feat/fix/docs(cN): description` |
| Quality gates | `npm run lint` (0 errors) · `npm run typecheck` (0 errors) · `npm run build` — must pass before merging |
| CI | GitHub Actions (`.github/workflows/ci.yml`) — triggered on push/PR; Node 20; `npm ci` cache |
| ADRs | `docs/adr/NNNN-slug.md` — status: Proposed → Accepted/Rejected/Superseded |
| Rollback point | `git reset --hard pre-restructure` (tag on commit `ce4abac`) |
| Package manager | **npm** (not pnpm — `pnpm-workspace.yaml` was a Figma artifact and has been deleted) |
| Mock toggle | `VITE_ENABLE_MSW=true` in `.env` for offline dev; omit/`false` when pointing at real backend |
| Cross-feature imports | Forbidden — shared types/utils go in `src/types/` or `src/lib/` |

---

## Artifact Index

| Document | Path |
|----------|------|
| ADR-0001: Feature-Based Structure | `docs/adr/0001-target-folder-structure.md` |
| ADR-0002: Routing & Auth | `docs/adr/0002-routing-and-auth.md` |
| ADR-0003: Mock API (MSW) | `docs/adr/0003-mock-api-msw.md` |
| Migration Plan (C0–C7 + deferred register) | `docs/design/migration-plan.md` |
| TypeScript Strict Mode Baseline | `docs/design/strict-errors.md` |
| QA C5 Review | `docs/qa/c5-review.md` |
