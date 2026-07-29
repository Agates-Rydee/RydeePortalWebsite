# Migration Plan — RydeePortalWebsite Restructure

Implements ADR-0001/0002/0003. **Structure/tooling only — zero behavior change, zero restyling.**
Each checkpoint = one small reviewable PR/commit, and **ends with `npm run build` passing**.
Executor: Frontend Developer. Rollback at any point: `git reset --hard pre-restructure` (tag from step 1).

## Checkpoint 0 — Git & Env Hygiene ✅ DONE (9dcc503)

| # | Step |
|---|------|
| 0.1 | `git tag pre-restructure` — rollback point |
| 0.2 | Expand `.gitignore`: `node_modules/`, `dist/`, `.env`, `.env.*`, `!.env.example`, `.vscode/`, `.idea/`, `*.local` |
| 0.3 | Create `.env.example` with placeholder values: `VITE_API_LOGIN_URL=`, `VITE_API_REGISTER_URL=`, `VITE_GOOGLE_MAPS_KEY=your-key-here`, `VITE_ENABLE_MSW=true` |
| 0.4 | `git rm --cached .env` (keep local file) — commit |
| 0.5 | **🔑 ROTATE the Google Maps API key** — it is in git history and must be treated as leaked. Rotation (new key + delete old in Google Cloud Console) is mandatory; history rewrite optional (repo is private/small — note and skip). Add HTTP-referrer restriction to the new key. |
| 0.6 | ✅ `npm run build` passes (no code touched — sanity gate) |

## Checkpoint 1 — Figma Artifact Strip + Package Identity ✅ DONE (3aeecae)

| # | Step |
|---|------|
| 1.1 | Delete `pnpm-workspace.yaml`, `guidelines/`, `default_shadcn_theme.css` |
| 1.2 | `package.json`: rename `@figma/my-make-file` → `rydee-portal-website`; delete `pnpm.overrides` block and `peerDependenciesMeta` |
| 1.3 | Move `react`, `react-dom` from `devDependencies` → `dependencies` (Figma export quirk) |
| 1.4 | `vite.config.ts`: remove `figmaAssetResolver` plugin + Figma comments (keep react, tailwindcss plugins, `@` alias, `assetsInclude`) |
| 1.5 | `rm -rf node_modules && npm install` → fresh committed `package-lock.json` |
| 1.6 | ✅ `npm run build` passes |

## Checkpoint 2 — Remove Agreed-Unused Dependencies ✅ DONE (9506ff5)

| # | Step |
|---|------|
| 2.1 | `npm rm @mui/material @emotion/react @emotion/styled maplibre-gl` (agreed unused; verify with `rg "@mui|@emotion|maplibre" src` → zero hits, first) |
| 2.2 | Do **not** remove anything else (Radix/shadcn deps stay; broader dep audit → deferred register) |
| 2.3 | ✅ `npm run build` passes |

## Checkpoint 3 — Tooling Baseline (ESLint + Prettier + typecheck + CI) ✅ DONE (35093f5)

| # | Step |
|---|------|
| 3.1 | Add devDeps: `eslint`, `typescript`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `prettier`, `eslint-config-prettier` |
| 3.2 | `eslint.config.js` (flat config): recommended TS + react-hooks presets, `eslint-config-prettier` last; ignore `src/components/ui/**` from lint (generated shadcn — keep as-is per scope) and `dist/` |
| 3.3 | `.prettierrc` (defaults + `printWidth: 100`) + `.prettierignore` (`src/components/ui`, `dist`, `package-lock.json`) — **do not run a repo-wide format on ui/**; format only files touched by migration |
| 3.4 | `package.json` scripts: `"lint": "eslint src"`, `"format": "prettier --write ."`, `"typecheck": "tsc --noEmit"` (note: repo currently has no `typescript` devDep — 3.1 adds it, pinned to the version Vite peer range allows) |
| 3.5 | **Strict mode (scope-safe handling)**: keep `"strict": false` in `tsconfig.json` this iteration. Add `"typecheck:strict": "tsc --noEmit --strict"` and run once; dump the error list verbatim into the deferred-work register (§D below). Flipping strict on = its own future PR after errors are fixed. This keeps structure-only scope while making the debt visible and CI-trackable. |
| 3.6 | `.github/workflows/ci.yml`: on push/PR → `npm ci` → `npm run lint` → `npm run typecheck` → `npm run build`; plus a `continue-on-error: true` job step for `typecheck:strict` (visible signal, non-blocking). Node 20, `actions/setup-node` cache: npm. Zero cost on GitHub free tier. |
| 3.7 | ✅ `npm run build` passes; CI green on PR |

## Checkpoint 4 — File Moves (ADR-0001 mapping, no splits yet) ✅ DONE (41d649e)

Pure `git mv` + import-path fixes only; `App.tsx` split deferred to Checkpoint 5.

| # | Step |
|---|------|
| 4.1 | `git mv src/imports src/assets`; fix 3 import paths (shared.tsx, App.tsx, RiderDashboard.tsx) |
| 4.2 | `git mv src/app/components/ui src/components/ui`; `git mv src/app/components/shared.tsx src/components/shared.tsx`; `git mv src/app/components/figma/ImageWithFallback.tsx src/components/ImageWithFallback.tsx`; delete empty `src/app/components/figma/` |
| 4.3 | Create `src/types/rider.ts` (move `RiderState`, `ActiveRider`, `PendingRider` from mockData.ts) and `src/mocks/data/riders.ts` (move seed arrays); delete `src/app/data/mockData.ts`; fix imports in ActiveRiders/PendingRiders |
| 4.4 | `git mv` pages: dashboards → `src/features/dashboards/`, riders → `src/features/riders/` (per ADR-0001 rows 7–12); fix imports (prefer `@/` alias while touching them) |
| 4.5 | `App.tsx` temporarily moves to `src/App.tsx` (still the string-switch — unchanged behavior); update `src/main.tsx` import; delete empty `src/app/` |
| 4.6 | ✅ `npm run build` passes + 2-minute manual smoke: login → each dashboard renders |

## Checkpoint 5 — Routing & Auth (ADR-0002) ✅ DONE (79822f1 + 8c22e86 + 884a0a4)

| # | Step |
|---|------|
| 5.1 | Create `src/lib/config.ts` (API URL constants lifted verbatim from App.tsx) and `src/types/profile.ts` (`Profile`, `ROLES`, `Role`, `roleHome()`) |
| 5.2 | Create `src/features/auth/AuthProvider.tsx` (in-memory context: profile/login/logout) and `src/features/auth/ProtectedRoute.tsx` + `PublicOnly` (redirect table per ADR-0002) |
| 5.3 | Extract `LoginPage.tsx` / `RegisterPage.tsx` from App.tsx into `src/features/auth/pages/` — fetch calls copied **byte-for-byte**; `onNavigate` callbacks replaced with `useNavigate()` + `auth.login()` |
| 5.4 | Create `src/router.tsx` with the ADR-0002 route tree; `RiderLocationView` old `params` passed via route param + `location.state` |
| 5.5 | Rewrite `src/main.tsx`: `<RouterProvider router={router}/>`; delete `src/App.tsx` (`Page` union + switch retired) |
| 5.6 | ✅ `npm run build` passes + smoke: guards redirect, back button works, logout → /login, deep-link to /admin while logged out → /login |

## Checkpoint 6 — Mock API via MSW (ADR-0003) ✅ DONE (40573ef)

| # | Step |
|---|------|
| 6.1 | `npm i -D msw@^2`; `npx msw init public/` (commit `public/mockServiceWorker.js`) |
| 6.2 | Create `src/mocks/{browser.ts, handlers/index.ts, handlers/auth.ts}` — handlers built on `lib/config.ts` URLs, seed users per role, shapes per ADR-0003 contract table |
| 6.3 | `src/main.tsx`: conditional async MSW boot (`import.meta.env.DEV && VITE_ENABLE_MSW==="true"`) before render |
| 6.4 | Add `VITE_ENABLE_MSW=true` to `.env.example`; README section: local dev with/without backend |
| 6.5 | ✅ `npm run build` passes + smoke: login works with MSW on & no backend; flag off + backend up → passthrough works |

## Checkpoint 7 — Close-out ✅ DONE (5dbb12c)

| # | Step |
|---|------|
| 7.1 | Update README (structure map, scripts, env setup); mark ADRs 0001–0003 **Accepted** |
| 7.2 | `git tag restructure-complete`; notify backend owners that `src/mocks/handlers/` is the living API contract |

## D — Deferred-Work Register (explicitly OUT of scope now)

| ID | Item | Source |
|----|------|--------|
| D1 | DOB input uses `type="number"` | Known bug — user-listed |
| D2 | Invalid `autoComplete` attribute values | Known bug — user-listed |
| D3 | `Boolean` (object type) in `Profile` interface | Known bug — user-listed |
| D4 | `RiderDashboard.tsx` self-import (`import NavigateParams from "./RiderDashboard"`) | Found during survey |
| D5 | `ImageWithFallback.tsx` unimported — delete or adopt | Found during survey |
| D6 | TS strict mode: unify RiderDashboard inline Profile with @/types/profile.ts, remove @ts-nocheck on RiderDashboard.tsx and @ts-expect-error at router.tsx:84, then flip strict:true. **C5 update:** strict = 0 errors; only these two suppressions remain. | Checkpoint 3.5 output |
| D7 | Map library consolidation (Google Maps vs Leaflet) | Agreed deferral |
| D8 | Adopt `components/ui` (shadcn) in pages / restyle iteration | Agreed deferral |
| D9 | Auth session persistence + rehydrate (sessionStorage or `/me`) | ADR-0002 |
| D10 | Dependency audit of remaining likely-unused deps (react-dnd, react-slick, react-responsive-masonry, canvas-confetti, react-popper, motion, recharts…) | Survey |
| D11 | `Customer` role: route/home destination undefined | ADR-0002 open question |
| D12 | Reuse MSW handlers in Node for vitest/Playwright test suite | ADR-0003 |
| D13 | Optional git-history rewrite to purge leaked `.env` (key rotation already mandatory in 0.5) | Checkpoint 0 |
| D14 | **Product question**: should `Admin` be a creatable role via `/admin/register`? Currently ROLES=[Operator, Customer, Rider] (verbatim from pre-C5 App.tsx). If Admin should be creatable, widen ROLES and audit backend accept-list. | QA C5 review — F2 |
| D15 | `AuthProvider.login(profile)` overwrites `profile.role` if backend responds with a different casing/value than the user selected. Investigate backend contract (does /user/login echo canonical role?), then normalize at the boundary rather than in the UI. | QA C5 review — F4 |
| D16 | Post-register navigation uses default (push) not `replace: true`, so browser back after successful registration returns to the register form. Add `{ replace: true }` to the `useNavigate()` call in RegisterPage.tsx. | QA C5 review — F5 |

## Risks & Assumptions
- **Assumption**: `npm run build` (vite build, no tsc) is the gate per checkpoint; `typecheck` becomes an additional gate from Checkpoint 3 onward.
- **Risk**: Checkpoint 5 is the largest diff (App.tsx split). Mitigation: 5.3 copies fetch/UI code verbatim; review diff with `--color-moved`.
- **Risk**: Figma strip list (Checkpoint 1) pending user confirmation — do not start C1 until confirmed; C0 can proceed immediately.
