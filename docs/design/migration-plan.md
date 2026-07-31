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
| D1 | ~~DOB input uses `type="number"`~~ **Closed 2026-07-31.** `rg 'type="number"' src/` → 0 hits; `DatePickerField` (button-trigger picker) replaced the number input in Iter 4.1 (`29099e3`). | Known bug — user-listed |
| D2 | ~~Invalid `autoComplete` attribute values~~ **Closed 2026-07-31.** All values in `LoginPage` + `RegisterPage` are valid HTML tokens (`tel`, `current-password`, `name`, `email`, `street-address`, `new-password`); fixed in Iter 2 (`6b114d2`). | Known bug — user-listed |
| D3 | ~~`Boolean` (object type) in `Profile` interface~~ **Closed 2026-07-31.** `rg 'Boolean' src/types/profile.ts` → doc-comment reference only; `online: boolean` (primitive) confirmed in type def; fixed `e84b920`. | Known bug — user-listed |
| D4 | ~~`RiderDashboard.tsx` self-import (`import NavigateParams from "./RiderDashboard"`)~~ **Closed 2026-07-31.** `rg 'NavigateParams' src/` → 0 hits; self-import removed `e84b920`. | Found during survey |
| D5 | ~~`ImageWithFallback.tsx` unimported — delete or adopt~~ **Closed 2026-07-31.** `rg 'ImageWithFallback' src/` → 0 hits; file moved + route-adapter split resolved import in `fe6c64f`. | Found during survey |
| D6 | ~~TS strict mode: unify RiderDashboard inline Profile with @/types/profile.ts, remove @ts-nocheck on RiderDashboard.tsx and @ts-expect-error at router.tsx:84.~~ **Closed 2026-07-31.** Verification on backlog batch: `rg 'ts-nocheck|ts-expect-error|ts-ignore' src/` returns 0 hits in code (only a doc-comment reference in `src/types/profile.ts`). `npm run typecheck:strict` = 0 errors. No suppressions remain. | Checkpoint 3.5 output (closed 2026-07-31) |
| D7 | Map library consolidation (Google Maps vs Leaflet). **2026-07-31 audit:** BOTH libs are genuinely imported in live app code — `@react-google-maps/api` (`GoogleMap`, `Marker`, `useJsApiLoader`) in `src/features/dashboards/RiderDashboard.tsx` and `src/features/riders/RiderLocationView.tsx`; `react-leaflet` (`MapContainer`, `TileLayer`, `CircleMarker`, `Popup`) + `leaflet` in `src/features/riders/ActiveRiders.tsx`. Per the D10 rule (never remove imported packages), no change made. **Needs owner decision:** which lib is the strategic choice? Consolidating onto one saves ~50 kB gzip. | Agreed deferral (still open — owner decision) |
| D8 | ~~Adopt `components/ui` (shadcn) in pages / restyle iteration~~ **Closed 2026-07-31.** QA SHIP verdict in `docs/qa/d8-restyle-review.md`; 44/44 tests green; shadcn primitives adopted across all pages commits `57545a6`/`38c773b`/`1a6962f`/`f3e195d` (Iter 3). | Agreed deferral |
| D9 | ~~Auth session persistence + rehydrate~~ **Client-side `localStorage` delivered 2026-07-29** (`rydee.session` key, versioned envelope `{ v:1, profile, savedAt }`, 24h client-side TTL, cleared on logout — F1-safe). Persistence I/O isolated in `src/features/auth/session.ts` so v2 (with tokens) is additive. **D9-remainder:** server-side revocation via `/me` endpoint still pending. | ADR-0002 |
| D17 | **Token-based auth integration**: backend refresh-token + TTL contract pending — needs an ADR when backend lands. Client envelope v2 will carry `{ accessToken, refreshToken, expiresAt }`; localStorage vs httpOnly-cookie trade-off decided in that ADR. Current 24h client-side TTL is a stopgap approximation. | D9 amendment 2026-07-29 |
| D10 | Dependency audit. **2026-07-31 audit:** the historical suspect list (react-dnd, react-slick, react-responsive-masonry, canvas-confetti, react-popper, motion/framer-motion) is ALREADY absent from `package.json` — nothing to remove there. Every remaining dep is imported by ≥1 shadcn primitive in `src/components/ui/**`. However **only 10 of 47 shadcn primitives are actually used by app code** outside `ui/` (button, card, badge, input, label, popover, checkbox, calendar, alert, alert-dialog + newly-adopted sheet). Deleting the 36 unused primitives would unlock removal of ~15 Radix/vaul/next-themes/embla/cmdk/input-otp/react-resizable-panels/sonner/recharts packages (~80–120 kB gzip potential), but H4 forbids editing/deleting `src/components/ui/**` without owner sign-off. **Zero packages removed under D10.** Needs owner decision on shadcn-primitive prune-set. | Survey (still open — H4-blocked, needs owner decision) |
| D11 | `Customer` role: route/home destination undefined | ADR-0002 open question |
| D12 | ~~Reuse MSW handlers in Node for vitest/Playwright test suite~~ **Closed 2026-07-31.** `tests/setup.ts` imports `setupServer` from `msw/node` and boots against `src/mocks/handlers`; `foundation.test.ts` verifies interception — Iter 2 (`79ffdbc` + `2ac660b`). | ADR-0003 |
| D13 | Optional git-history rewrite to purge leaked `.env` (key rotation already mandatory in 0.5) | Checkpoint 0 |
| D14 | **Product question**: should `Admin` be a creatable role via `/admin/register`? Currently ROLES=[Operator, Customer, Rider] (verbatim from pre-C5 App.tsx). If Admin should be creatable, widen ROLES and audit backend accept-list. | QA C5 review — F2 |
| D15 | `AuthProvider.login(profile)` overwrites `profile.role` if backend responds with a different casing/value than the user selected. Investigate backend contract (does /user/login echo canonical role?), then normalize at the boundary rather than in the UI. | QA C5 review — F4 |
| D16 | ~~Post-register navigation uses default (push) not `replace: true`.~~ **Closed 2026-07-31.** `RegisterPage.tsx:200` already carried `navigate('/login', { replace: true })` from an earlier commit; batch A added the regression test `tests/regression/register-flow.test.tsx` (memory-router history assertion: back-button after successful register lands on prior route, not `/register`). | QA C5 review — F5 (closed 2026-07-31) |
| D18 | ~~**Migrate `PendingRiders` to the live `/GetAll/UnregisteredRiders` endpoint.**~~ **Done 2026-07-30.** PendingRiders now fetches directly on mount (POST + `credentials:'include'`) using the same URL constant as the dashboards; the local `PENDING_RIDERS` seed was removed. Wire shape reconciled at the boundary via `toPendingRider()` — `id/dob/cnic/documents/pin` are best-effort (page-local defaults when the backend omits them). The richer review UX (CNIC, verification docs, block-rider AlertDialog, generate-PIN) is preserved intact. `KARACHI_AREAS` + `VERIFICATION_DOCS` moved to `src/features/riders/constants.ts` (UI constants, not mock seeds). Approve/save/block mutations still client-local — awaits backend mutation endpoints. | 2026-07-29 origin/main merge (closed 2026-07-30) |

| D23 | **XLSX export for All Riders table** deferred (ADR-0004 §D2). MVP ships CSV-only via a ~30-LOC hand-rolled RFC-4180 serializer (`src/features/riders/csv.ts`); XLSX needs `xlsx` (~90 kB gzip) which would break the 219–227.9 kB band without a D22-style chunk split or a deliberate band bump. Revisit after admin usage feedback. | Frontend Dev + Architect | Backlog |
| D22 | **Route-level code-splitting:** introduce `React.lazy` route chunks (auth vs dashboards vs riders) when bundle growth warrants (~300+ kB gzip or addition of heavy new features). The datepicker micro-split (async `DatePickerPopover` chunk) was removed in Iter 4.4 (owner decision 2026-07-30) — app is ~224 kB, split premium exceeded value. Seams (auth/dashboard/riders boundaries) already documented in git history; revisit at route granularity, not component granularity. | Frontend Dev + Architect | Backlog |

## Risks & Assumptions
- **Assumption**: `npm run build` (vite build, no tsc) is the gate per checkpoint; `typecheck` becomes an additional gate from Checkpoint 3 onward.
- **Risk**: Checkpoint 5 is the largest diff (App.tsx split). Mitigation: 5.3 copies fetch/UI code verbatim; review diff with `--color-moved`.
- **Risk**: Figma strip list (Checkpoint 1) pending user confirmation — do not start C1 until confirmed; C0 can proceed immediately.
| D24 | **Bundle-size band adjustment 2026-07-31**: fast-follow F1/F2/F3 on the All Riders table (URL persistence + sticky header + row → detail Sheet via shadcn `Sheet` primitive) added the Radix Dialog primitive to the app bundle for the first time. New guard band: **221.5–224.5 kB**, measured on the largest `dist/assets/index-*.js` chunk via Node `zlib.gzipSync` at default level 6 (deterministic given the Node major pinned in `package.json` `engines`: `>=24 <25`). Vite CLI reports ~228.5 kB for the same build — same algorithm/level, but Vite measures a different intermediate artifact (pre-final-hash asset accounting), not a different compression setting. CI enforces the test's number. Original ~3 kB headroom preserved. D23's reference to the old 219–227.9 band is superseded. | 2026-07-31 backlog batch |
| D25 | **Radix Sheet primitive emits `Function components cannot be given refs` warning in test stderr** (SheetOverlay via Slot in `src/components/ui/sheet.tsx`, H4-locked). Not a functional failure — Sheet open/close/content tests pass. Revisit if the warning spreads with more Sheet usages; fix = regenerate the sheet primitive via the shadcn CLI (current version predates the fix). | 2026-07-31 QA follow-up |

| D26 | **`src/components/ui/*` primitives are React-19-style (no `forwardRef`; ref-as-prop function components with `data-slot`).** On React 18.3.1 any external `asChild`/`Slot` composition that expects to forward a ref onto a `ui/` function component drops the ref — same class as D25. Confirmed on `SidebarMenuButton` (task-3 footer NavUser: `DropdownMenuTrigger asChild → SidebarMenuButton` produced a `SlotClone` warning and killed the click, fixed 2026-07-31 by inverting the nesting to `SidebarMenuButton asChild → DropdownMenuTrigger`). Also observed on `Sheet` (D25). Proper fix: regenerate the affected primitives via the shadcn CLI once we can adopt the React-18-compatible output, or upgrade to React 19. | 2026-07-31 QA follow-up |
