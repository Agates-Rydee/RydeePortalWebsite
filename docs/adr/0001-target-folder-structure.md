# ADR-0001: Target Folder Structure (Feature-Based)

## Status
Accepted (2026-07-29, at end of Checkpoint 7)

## Context
RydeePortalWebsite is a Figma Make export: React 18 + Vite 6 + Tailwind 4 + TS (non-strict), ~1500 LOC of app code. All views hang off a 357-line `App.tsx` string-switch. 48 shadcn `ui/` files are present but unreferenced. We are restructuring for a small (~8 person) team ahead of routing (ADR-0002) and mock API (ADR-0003) work. **Scope: structure only — no behavior changes, no restyling.**

## Options Considered

1. **Feature-based** (`src/features/{auth,riders,dashboards}` + `src/{components,lib,types,mocks,assets,styles}`)
   - Pros: code co-located by domain; matches route tree in ADR-0002 (`/rider/*`, `/admin/*`); features deletable/replaceable in isolation; scales as backend lands.
   - Cons: some judgment calls on boundaries; shared types must be hoisted to avoid cross-feature imports.
2. **Layer-based** (keep `pages/`, `components/`, `data/` — polish only)
   - Pros: near-zero migration cost; familiar from export.
   - Cons: `App.tsx` stays a god-file; every layer touched per change; mock data mixed with types; doesn't align with role-scoped routes.
3. **Do nothing** — rejected: blocks routing/auth/MSW work cleanly landing anywhere.

## Decision
**Option 1 — feature-based**, with a thin shared tier. Rules:
- Features may import from `src/{components,lib,types,assets}` — never from each other.
- Shared cross-feature types (e.g. `Profile`) live in `src/types/`.
- Mock **data** lives under `src/mocks/` (MSW seeds, ADR-0003); mock-derived **types** hoist to `src/types/`.
- Imports use the existing `@/` alias (already in `vite.config.ts` + `tsconfig`).

### Target tree
```text
src/
  main.tsx                  # entry: mounts <RouterProvider>, conditional MSW boot
  router.tsx                # route tree + guards wiring (ADR-0002)
  assets/                   # Logo.png, MapIcon.png
  styles/                   # unchanged (5 css files)
  types/                    # profile.ts, rider.ts
  lib/                      # config.ts (env/API URLs), future utils
  components/               # shared.tsx, ImageWithFallback.tsx
    ui/                     # 48 shadcn files — untouched
  features/
    auth/                   # AuthProvider, guards, Login/Register pages
    dashboards/             # Rider/Admin/Operator dashboards
    riders/                 # ActiveRiders, PendingRiders, RiderLocationView
  mocks/                    # MSW worker + handlers + seed data (ADR-0003)
```

## Before → After Mapping (every existing file)

| # | Before | After | Notes |
|---|--------|-------|-------|
| 1 | `src/main.tsx` | `src/main.tsx` | Stays; contents updated for router + MSW boot |
| 2 | `src/app/App.tsx` | **split** → `src/router.tsx`, `src/features/auth/pages/LoginPage.tsx`, `src/features/auth/pages/RegisterPage.tsx`, `src/features/auth/AuthProvider.tsx`, `src/types/profile.ts`, `src/lib/config.ts` | `Page` union + switch deleted (ADR-0002); `Profile` → types; API URL consts → `lib/config.ts`; `ROLES` → `src/types/profile.ts` |
| 3 | `src/app/components/shared.tsx` | `src/components/shared.tsx` | Content unchanged |
| 4 | `src/app/components/ui/*` (48 files) | `src/components/ui/*` | Byte-identical move; zero app imports today |
| 5 | `src/app/components/figma/ImageWithFallback.tsx` | `src/components/ImageWithFallback.tsx` | Currently unimported — deletion candidate in deferred register |
| 6 | `src/app/data/mockData.ts` | **split** → types (`RiderState`, `ActiveRider`, `PendingRider`) → `src/types/rider.ts`; seed arrays (`INITIAL_ACTIVE_RIDERS`, `PENDING_RIDERS`, `KARACHI_AREAS`) → `src/mocks/data/riders.ts` | ActiveRiders/PendingRiders update imports only |
| 7 | `src/app/pages/RiderDashboard.tsx` | `src/features/dashboards/RiderDashboard.tsx` | Note: contains a self-import (`NavigateParams`) — leave as-is, deferred register |
| 8 | `src/app/pages/AdminDashboard.tsx` | `src/features/dashboards/AdminDashboard.tsx` | |
| 9 | `src/app/pages/OperatorDashboard.tsx` | `src/features/dashboards/OperatorDashboard.tsx` | |
| 10 | `src/app/pages/ActiveRiders.tsx` | `src/features/riders/ActiveRiders.tsx` | Leaflet stays (maps consolidation deferred) |
| 11 | `src/app/pages/PendingRiders.tsx` | `src/features/riders/PendingRiders.tsx` | |
| 12 | `src/app/pages/RiderLocationView.tsx` | `src/features/riders/RiderLocationView.tsx` | Google Maps stays |
| 13 | `src/imports/Logo.png` | `src/assets/Logo.png` | |
| 14 | `src/imports/MapIcon.png` | `src/assets/MapIcon.png` | |
| 15 | `src/styles/{fonts,globals,index,tailwind,theme}.css` | unchanged | |
| 16 | `index.html` | unchanged (root) | |
| 17 | `vite.config.ts` | unchanged path | Strip `figmaAssetResolver` + Figma comments |
| 18 | `tsconfig.json` | unchanged path | `typecheck` script added; strict handling per migration plan |
| 19 | `postcss.config.mjs` | unchanged | |
| 20 | `package.json` | unchanged path | Rename `@figma/my-make-file` → `rydee-portal-website`; drop `pnpm.overrides`; remove unused deps |
| 21 | `package-lock.json` | unchanged (committed) | npm is the package manager |
| 22 | `pnpm-workspace.yaml` | **delete** | Figma artifact |
| 23 | `default_shadcn_theme.css` | **delete** | Figma artifact (unreferenced) |
| 24 | `guidelines/` | **delete** | Figma artifact |
| 25 | `.env` | **delete from git** → `.env.example` (placeholder values) | Key rotation required — see migration plan Phase 0 |
| 26 | `.gitignore` | unchanged path | Expand: `dist/`, `.env*`, editor files |
| 27 | `README.md`, `ATTRIBUTIONS.md` | unchanged (root) | README updated post-migration |

New files introduced (by later ADRs): `src/router.tsx`, `src/features/auth/{AuthProvider,ProtectedRoute}.tsx`, `src/features/auth/pages/{LoginPage,RegisterPage}.tsx`, `src/types/{profile,rider}.ts`, `src/lib/config.ts`, `src/mocks/{browser.ts,handlers/*,data/riders.ts}`, `public/mockServiceWorker.js`, `.github/workflows/ci.yml`, `eslint.config.js`, `.prettierrc`, `.env.example`.

## Consequences
- Positive: route tree, auth, and MSW each get an obvious home; `App.tsx` god-file eliminated; features independently reviewable.
- Negative: one-time import-path churn across ~10 files; `App.tsx` split is the riskiest move (mitigated by checkpointed migration + `npm run build` gates).
- Neutral: `components/ui/` remains dormant until a future restyle iteration.

## Assumptions / Open questions / Risks
- **Assumption**: no other repo consumes these paths (standalone SPA).
- **Open**: does `Customer` role (in `ROLES`) get a route later? Not designed for yet.
- **Risk**: `App.tsx` split may surface latent TS errors under future strict mode — recorded, not fixed (structure-only scope).

## References
ADR-0002 (routing/auth), ADR-0003 (MSW), docs/design/migration-plan.md
