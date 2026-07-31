# PROJECT.md — RydeePortalWebsite

> **Last updated:** 2026-07-31 · Snapshot, not a log — rewrite stale sections.

---

## Overview

RydeePortalWebsite is a single-page React portal for the Rydee ride-hailing platform (DBX8 / MEU-FQA). It serves three active roles (Rider, Admin, Operator) with role-scoped dashboards and rider management screens. Stack: **React 18.3.1 + Vite 6 + TypeScript + Tailwind CSS 4 + shadcn/ui**, routing via **react-router 7** (library/browser mode), mock API via **MSW 2.x** (flag-gated), package manager **npm**. The backend is WIP elsewhere at `localhost:3000`; the API contract is frozen at `POST /user/login` (`{ phone, password }`) and `POST /register/user` (`{ name, email, phone, dob, address, password, role }`), `credentials: "include"` (field renamed `phoneNumber` → `phone` 2026-07-30; see ADR-0003 H1 amendment).

---

## Current State (as of 2026-07-31)

Iteration 5 — Backend Wire-Compat + All Riders Admin Table + Backlog Batch is **IN PROGRESS** (working tree uncommitted; awaiting owner manual commit). Iter 4 foundations intact. 96/96 vitest + 1/1 Playwright green; bundle 223.12 kB gzip guard band 221.5–224.5 kB; Node engines pinned `>=24 <25`.

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
| TypeScript strict mode | ✅ Done — `strict: true` flipped in `e84b920`; `typecheck:strict` script now redundant (candidate for future chore) |
| `.env` removed from git | ✅ Done |
| **🔑 Google Maps key rotation** | ✅ **DONE (2026-07-30, dandkhan)** — new key issued + HTTP-referrer restriction applied. D13 (git history rewrite) now optional / low-priority. |
| Collaborator merge round (b0ef29c) | ✅ Done — see below |
| **Iteration 2 — Hardening** | ✅ **COMPLETE 2026-07-30** |
| **Iteration 3 — D8 shadcn Restyle** | ✅ **COMPLETE 2026-07-30** — commits `57545a6` / `38c773b` / `1a6962f` / `f3e195d`; QA SHIP; UX 5/5 deviation approvals |
| **Iteration 4 — Form Validation + Datepicker** | ✅ **COMPLETE 2026-07-30** — commits `f9fcfc0` / `9948996` / `4252e13` / `7693215` / `731dff6` / `1dc7781` / `532391d`; QA SHIP; 3× INFO findings only |
| **Iteration 5 — Backend Wire-Compat + All Riders** | 🟡 **IN PROGRESS 2026-07-31** — working tree uncommitted; see Iteration 5 section below |

**D8 restyle summary:**
- shadcn primitives adopted across all pages (auth, dashboards, riders) — Radix `<Checkbox>`, `<AlertDialog>`, `<Button>`, `<Card>`, `<Input>`, `<Label>`, `<Badge>`, `<Select>`, `<Table>` in use
- Palette A (`--primary #0d8f6e`) — WCAG AA on all tokens; one documented borderline: `--primary` = 4.06:1 on white (passes AA-Large / UI 3:1, borderline AA-normal; documented in `theme.css`; see QA F1/P3 → D19)
- 32 JS inline style event handlers removed (`onMouseEnter`/`onMouseLeave`/`onFocus={style}`/`onBlur={style}`)
- `src/components/shared-styles.ts` deleted (46-line legacy helper)
- a11y items closed: Radix `<Checkbox>` replaces div-as-checkbox, `<AlertDialog>` focus-trap, `focus-visible:ring-*` via shadcn, `role="alert"`/`status` + `aria-live` on errors/banners, `@media (prefers-reduced-motion)` global guard in `theme.css`, `sr-only` caption + `fieldset/legend` on documents group, password-toggle `aria-pressed` + tab order restored
- New shared components: `DashboardHeader`, `StatCard` in `src/features/dashboards/components/`

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

## Iteration 2 — Hardening ✅ COMPLETE 2026-07-30

Batched execution, QA-gated before each push. All items closed.

| Work Item | Source | Commit | Status |
|-----------|--------|--------|--------|
| Strict mode flip (`strict: true`) | D6 | `e84b920` | ✅ CLOSED |
| Unify inline `Profile` / remove `@ts-nocheck` + `@ts-expect-error` | D6 | `e84b920` | ✅ CLOSED |
| Fix `RiderDashboard` self-import (`NavigateParams`) | D4 | `e84b920` | ✅ CLOSED |
| `Boolean` object type in `Profile` → `boolean` | D3 | `e84b920` | ✅ CLOSED (folded into Profile unification — see commit note) |
| DOB input `type="number"` → `type="text"` | D1 | `6b114d2` | ✅ CLOSED |
| Invalid `autoComplete` values | D2 | `6b114d2` | ✅ CLOSED |
| `login()` role-overwrite normalization | D15 | `6b114d2` | ✅ CLOSED |
| Post-register `navigate` → `replace: true` | D16 | `6b114d2` | ✅ CLOSED |
| Router react-refresh lint-warning split (route adapters) | D5 | `fe6c64f` | ✅ CLOSED |
| Dependency audit — 8 unused deps removed | D10 | `6f4e165` | ✅ CLOSED |
| react-router security patch → `^7.18.2` | D10 | `6f4e165` | ✅ CLOSED |
| Test foundation — vitest + RTL + msw/node | D12 | `79ffdbc` | ✅ CLOSED |
| Regression suite — 44 tests (auth, guards, session) | D12 | `2ac660b` | ✅ CLOSED |

**Iteration 2 gate results (final):** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build 596.98 kB / **170.07 kB gzip** · test 44/44 ✅

---

## Iteration 3 — D8 shadcn Restyle ✅ COMPLETE 2026-07-30

4-phase execution; QA SHIP verdict (`docs/qa/d8-restyle-review.md`); 5/5 UX deviation approvals.

| Phase | Commit | Scope |
|-------|--------|-------|
| Phase 1 — auth pages | `57545a6` | `AuthShell`, `LoginPage`, `RegisterPage` restyle with shadcn |
| Phase 2 — dashboard chrome | `38c773b` | `AdminDashboard`, `OperatorDashboard`, `RiderDashboard` + new `DashboardHeader`/`StatCard` |
| Phase 3 — riders | `1a6962f` | `ActiveRiders`, `PendingRiders` restyle (Radix Checkbox + AlertDialog) |
| Phase 4 — cleanup | `f3e195d` | `RiderLocationView` cleanup; `shared-styles.ts` deleted; 32 JS style handlers removed |

**Iteration 3 gate results (final):** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build 1984 modules / **192.90 kB gzip** · test 44/44 ✅

**Bundle baseline reset:** 192.90 kB gzip (+22.83 kB from Iter 2; delta = Radix AlertDialog + Checkbox runtime). ±2% band (±3.86 kB) applies from this baseline.

**UX deviation approvals (5/5):**
1. Role dropdown kept native `<select>` (test-selector constraint, spec §6.4)
2. PendingRiders rider/area selects kept native (Radix Select+popper ~20 kB gzip — over budget)
3. Primary bg solid `#0d8f6e` (Option B gradient → flat; documented in `theme.css`)
4. RiderDashboard profile table kept native `<table>` (a11y met via `sr-only` caption + `scope="row"`)
5. ActiveRiders Leaflet popup state badges use inline hex (Leaflet Popup outside React style tree)

**QA P3 residuals → D19/D20/D21 (see register below)**

---

## Iteration 4 — Form Validation, Datepicker & UX Polish ✅ COMPLETE 2026-07-30

7-commit execution; QA SHIP verdict (`docs/qa/iter4-review.md`); 3× INFO findings resolved.

| Commit | Scope |
|--------|-------|
| `f9fcfc0` | fix(styles): cursor-pointer global CSS rule — Tailwind v4 preflight root cause |
| `9948996` | fix(riders): `.select-field` class restores PendingRiders select chrome |
| `4252e13` | feat(dashboards): clickable StatCard as semantic `<button>` w/ aria-label + motion-reduce |
| `7693215` | feat(auth): form validation Login+Register per matrix, age 18–100, on-blur+submit, ARIA wiring, dob DD/MM/YYYY→ISO |
| `731dff6` | feat(auth): shadcn Calendar+Popover DOB datepicker, react-day-picker v8 dropdown-buttons 1940..current−18, ADR-0003 dob footnote |
| `1dc7781` | perf(auth): code-split DobPicker lazy chunk |
| `532391d` | test: 14 additive regression tests (iter4-additive.test.tsx) |

**Product decisions (owner: Danial Khan, 2026-07-30):**
1. DOB displays DD/MM/YYYY in UI; submits ISO YYYY-MM-DD — documented in ADR-0003 footnote.
2. Minimum age **18** (supersedes spec §1.3/§2.3 draft value of 16); maximum 100.

**Iteration 4 gate results (final):** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build 2017 modules / **195.04 kB gzip** (within ±2% band) · test **58/58** ✅

**Bundle baselines reset:**
- Main bundle: **195.04 kB gzip** (band ±2% = 191.1–198.9 kB)
- Async DobPicker chunk: **28.64 kB gzip** (loads on first picker open only)

**QA F-findings (all INFO):**
- F1 — hash citation in review refers to `c0c9163` but actual tip is `1dc7781` (identical semantics; docs-only note)
- F2 — spec §1.3/§2.3 still shows 16-100 draft; resolved by amendment in `docs/ux/iter4-spec.md`
- F3 — cursor rule improvement is spec-sample deviation; implementation superior; no action

### Iteration 4.1 Hotfix ✅ COMPLETE 2026-07-30

Product-owner rejected the Iter 4 §2 datepicker UX (ghost-icon trigger undiscoverable on RegisterPage; PendingRiders DOB still native `type=date`). Typed DD/MM/YYYY entry removed — owner-approved trade. See `docs/ux/iter4-spec.md` Product Decisions Amendment §Iter 4.1 and `docs/qa/iter4-review.md` §Iteration 4.1 Addendum.

| Commit | Scope |
|--------|-------|
| `29099e3` | feat(auth): shared shadcn-canonical DatePickerField + DatePickerPopover lazy chunk + date-helpers; RegisterPage adoption; typed DOB entry removed |
| `6113b5c` | feat(riders): PendingRiders DOB adopts shared DatePickerField; ISO state preserved for calcAge |

**Hotfix gate results:** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **195.27 kB gzip** (band 191.1–198.9 ✓) · test **55/55** ✅

**Test-count revision (58 → 55 — honest record):** Prior close-out reported 58 (44 baseline + 14 additive). Hotfix revised additive count to 11 (net −3): 6 typed-entry tests removed because they drove input fields that no longer exist after typed entry removal — these scenarios are unreachable by design (picker year/day bounds enforce age ≥ 18 and calendar grid never offers Feb 29 on non-leap years); 3 new button-pattern tests added covering the canonical trigger, required-dob submit blocking, and `aria-invalid` wiring. Baseline 44 tests byte-identical. ISO wire contract retained by `contract.test.ts`. Removals are principled, not a quality regression.

**Bundle baseline update:**
- Main bundle: **195.27 kB gzip** (±2% band 191.1–198.9 kB — unchanged)
- Async chunk renamed `DobPicker-*` → `DatePickerPopover-*`: **28.75 kB gzip** (was 28.64 kB, +0.11 kB — within noise)

**Deleted:** `src/features/auth/pages/components/DobPicker.tsx` (superseded by `src/components/DatePickerField.tsx` + `DatePickerPopover.tsx`)

**QA F-findings (all INFO):** F-4.1-01 underage-in-current-year window (submit blocks wire; no action), F-4.1-02 `dobToIso` transform coverage gap (contract.test.ts covers wire shape; no action), F-4.1-03 async chunk rename (expected; no action). Full findings in `docs/qa/iter4-review.md` §Iteration 4.1 Addendum.

### Iteration 4.2 P1 Hotfix ✅ COMPLETE 2026-07-30

**Incident:** DOB picker never opened after Iter 4.1 shipped. Root cause: **version-skew class of bug** — shadcn primitives generated for wrong library versions. `ui/button.tsx` was in React-19 ref-as-prop style (function component receiving `ref` as a plain prop) running on React 18.3.1; Radix `asChild` (`PopoverTrigger asChild → Button`) silently dropped the anchor ref because `forwardRef` was absent, so `[data-radix-popper-content-wrapper]` never mounted. `ui/calendar.tsx` classNames targeted react-day-picker v9 CaptionDropdowns naming conventions while the installed library is v8 — produced garbled caption layout.

| Commit | Scope |
|--------|-------|
| `ab2a32c` | fix(ui): `button.tsx` full-file rewrite back to `React.forwardRef<HTMLButtonElement, ButtonProps>` — H4-compliant; cva config byte-identical; fixes P1 and (as free win F-4.2-01) the latent identical bug in `PendingRiders` `AlertDialogTrigger asChild` |
| `65e966b` | fix(ui): `calendar.tsx` full-file rewrite mapping react-day-picker v8 CaptionDropdowns classNames; scoped trigger field-styling on `DatePickerField`/`DatePickerPopover` (palette-collision fix: outline button no longer flashes primary-green on hover/open) |
| `54d1121` | test(e2e): opt-in Playwright Chromium smoke — `npm run test:e2e`, `tests/e2e/datepicker.spec.ts`; 1 passed 9.5s; closes structural gap F-4.2-02 (jsdom structurally cannot exercise the lazy Radix chunk) |

**QA verdict:** ✅ **SHIP** — all 5 gates green; H1–H8 verified; `asChild` blast-radius clean; free win F-4.2-01 documented. E2E smoke 1/1 passed.

**Free win (F-4.2-01):** Primitive-level `button.tsx` fix simultaneously resolved a latent identical P1 in the `Block rider` `AlertDialogTrigger asChild` path on `/admin/pending-riders` at zero incremental cost.

**Hotfix gate results:** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **195.31 kB gzip** (band 191.1–198.9 ✓) · test **55/55** ✅ · e2e 1 smoke ✅

**Bundle baseline update:**
- Main bundle: **195.31 kB gzip** (±2% band 191.1–198.9 kB — unchanged)
- Async DatePickerPopover chunk: **28.94 kB gzip** (+0.19 kB vs 4.1 — well within noise)

Full QA addendum in `docs/qa/iter4-review.md` §Iteration 4.2 addendum.

### Iteration 4.3 Perf Fix ✅ COMPLETE 2026-07-30

**Problem:** First-click spinner on the DOB picker — Suspense fallback fired while the lazy `DatePickerPopover` chunk was fetched, causing a visible flash on slow networks.

**Fix:** Memoised shared loader (`src/components/DatePickerPopover.loader.ts`) + layered prefetch strategy: `requestIdleCallback` (1.75 s `setTimeout` fallback) fires on mount; `pointerenter`/`focus` on the trigger accelerate prefetch for pointer/keyboard users. All three paths funnel through a single memoised `import()` promise (exactly-one-request invariant). Code-split preserved; Suspense spinner retained as slow-network safety net.

| Commit | Scope |
|--------|-------|
| `678d753` | perf(components): memoised shared loader + layered prefetch (requestIdleCallback + pointer/focus hooks) |
| `aa7ed38` | docs: QA Iteration 4.3 addendum committed |

**QA verdict:** ✅ **SHIP** — `docs/qa/iter4-review.md` §Iteration 4.3 addendum. H1–H8 all 🟢. No new tests needed (behavior is real-browser/real-network; existing E2E smoke 1/1 ✅).

**Hotfix gate results:** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **195.46 kB gzip** (band 191.1–198.9 ✓) · test **55/55** ✅ · e2e 1/1 ✅

**Bundle baseline update:**
- Main bundle: **195.46 kB gzip** (±2% band 191.1–198.9 kB — unchanged)
- Async DatePickerPopover chunk: **28.93 kB gzip** (−0.01 kB vs 4.2 — within noise)

### Iteration 4.4 Datepicker Simplification ✅ COMPLETE 2026-07-30

**Owner decision (Danial Khan, 2026-07-30):** At ~224 kB total the app doesn't justify micro-splitting the 29 kB picker chunk against the cost of `React.lazy` + `Suspense` + `pickerMounted` state + prefetch (idle + pointerenter/focus) + spinner + loader-module machinery. `DatePickerPopover.tsx` + `DatePickerPopover.loader.ts` deleted; all logic folded into `DatePickerField.tsx` (static imports, Radix controlled `open` state). **Net result: −146 lines, zero loading states, single JS chunk.** Route-level code-splitting to be reconsidered when the app genuinely grows (see D22).

| Commit | Scope |
|--------|-------|
| `0f79f7e` | refactor(components): merge DatePickerPopover into DatePickerField, drop lazy split, static imports, controlled Radix open |
| `0b764d0` | docs: QA Iteration 4.4 addendum (verdict SHIP; F-4.4-01 doc-only, F-4.4-02 recommend-only) |
| `3b9e1bf` | chore: stale-comment cleanup |

**Iteration 4.4 gate results (final):** lint 0e/0w · typecheck 0 · typecheck:strict 0 · build 15.4s / **223.43 kB gzip SINGLE chunk** (no async chunks) · test **55/55** · e2e 1/1 ✅

**Bundle baselines reset:**
- Main bundle: **223.43 kB gzip** (±2% band **219.0–227.9 kB**)
- Async DatePickerPopover chunk: **no longer exists** — picker/calendar are statically bundled into main

**QA F-findings:**
- F-4.4-01 — Minor/doc-only: stale JSDoc in `RegisterPage.tsx:286-288` references "lazy split PRESERVED" post-simplification; non-blocking, refresh next time file is edited
- F-4.4-02 — Recommend-only: re-adding jsdom "select-a-date → ISO wire" test not recommended (E2E + contract.test.ts cover the invariant; rdp v8 native overlay fragile in jsdom)

---

## Iteration 5 — Backend Wire-Compat, All Riders Table & Backlog Batch 🟡 IN PROGRESS (2026-07-31)

Working tree uncommitted; owner commits manually. All 5+1 gates green on working tree snapshot.

### Batch A — Backend Wire-Compat (commit `b2cd8ce` + working tree)
- **H1 contract amendment**: `POST /register/user` field renamed `phoneNumber` → `phone` (backend confirmed 2026-07-30); `RegisterPage`, `PendingRiders`, MSW handler, ADR-0003 contract table all updated in same-commit sweep.
- **Wire aliases**: `area`/`rideArea` and `activation_status`/`activated` (boolean) both accepted at the boundary; normalisation in `toAllRidersRow()` and `toPendingRider()`.

### Batch B — All Riders Admin Table (ADR-0004, working tree)
- **Route**: `/admin/all-riders`, `ProtectedRoute allow={["Admin","Operator"]}` — same guard group as active/pending riders (ADR-0002 QA-F3 Option A). Static import (D22 threshold not reached).
- **Engine**: hand-rolled sort/filter/paginate over client array (ADR-0004 Decision 1) — TanStack Table deferred; ~150 LOC `useMemo` chains; zero new deps.
- **Data contract**: new proposed endpoint `POST /GetAll/Riders` (`API_GET_ALL_RIDERS_URL`); MSW handler + ADR-0003 row added same-commit (H6); server-ready for backend. Response `{ riders: [...] }`, 7 columns (ID, Name, Phone, CNIC, Status, Area, Joined).
- **Features**: status tabs (All/Active/Pending/Blocked/Offboarded), 300ms-debounced search, 3-state single-column sort, pagination 10/25/50/100 (default 10), **URL-persisted filters** (`?status=&q=&sort=&dir=&page=`), sticky header, row → `RiderDetailSheet` (shadcn `Sheet` primitive).
- **CSV export** RFC-4180 (~30-LOC `src/features/riders/csv.ts`); exports filtered view; filename `rydee-riders-{tab}-{YYYY-MM-DD}.csv`. XLSX deferred (D23 — needs ~90 kB dep or band bump decision).
- **D6 closed** (see Iter 2); **D16 closed** (regression test `register-flow.test.tsx` added).

### Batch C — Backlog Batch (working tree)
- **D6/D16 closed** — final verification + register-flow regression test.
- **D10/D7 investigated** — D10: only 10/47 shadcn primitives used; zero packages removed (H4-blocked, needs owner decision; see Open Items). D7: both Google Maps and Leaflet confirmed live in app code; owner decision pending.
- **Bundle guard band reset** (D24): Radix Dialog first entered bundle via `Sheet`; new band **221.5–224.5 kB** (`zlib.gzipSync` default-6, Node `>=24 <25`). D23 reference to 219–227.9 kB superseded.
- **Node engines pinned** `>=24 <25` in `package.json` for deterministic gzip measurements.
- **D25 tracked**: Radix Sheet emits `Function components cannot be given refs` warning in test stderr (H4-locked, non-functional; see D25).

### Gate results (working tree snapshot)
lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **223.12 kB gzip SINGLE chunk** (band 221.5–224.5 ✓) · test **96/96** vitest · e2e **1/1** Playwright ✅

### ⚠️ Correction on QA cert 2026-07-30
The 2026-07-30 QA cert reported "vitest 61/61" — this was a miscount. Verified true count at that snapshot was **55**. No tests were lost; the miscount was a reporting error. Current count is 96/96 (55 baseline + 41 new Iter 5 tests: all-riders suite, bundle-size guard, CSV unit, mapper unit, register-flow regression).

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
| shadcn/ui adopted across all pages (D8 CLOSED) | 48 `components/ui/` files consumed untouched (H4); Palette A selected; 32 JS style handlers removed; `shared-styles.ts` deleted | [docs/qa/d8-restyle-review.md](qa/d8-restyle-review.md) |
| Both map libs kept (Google Maps + Leaflet) | Consolidation deferred (D7) | ADR-0001 |
| `strict: true` enabled (Iter 2) | Flipped in `e84b920`; `typecheck:strict` script now redundant — candidate for future chore to fold | [strict-errors.md](design/strict-errors.md) |
| API contract frozen (H1) | Field names, `credentials:include`, endpoint paths locked; MSW handlers are the living contract | ADR-0003 |
| AGENTS.md is canonical contributor rules | H1–H8 hard rules bind all contributors and AI coding tools | [AGENTS.md](../AGENTS.md) |
| New endpoint `/GetAll/UnregisteredRiders` | `API_GET_UNREGISTERED_RIDERS_URL` in config; MSW handler + ADR-0003 row added in b0ef29c | ADR-0003 fn² |
| PendingRiders live-endpoint migration deferred | Mock-driven UX preserved; migration tracked as D18 | D18 |
| D13 (git history rewrite) — optional/low-priority | Google Maps key rotated (2026-07-30); old history purge is cosmetic only now | D13 |
| react-router ^7.18.2 security patch | Patched in `6f4e165`; v8 major upgrade declined (out of scope); bundle baseline reset to 170.07 kB gzip | D10 |
| Bundle baseline reset (Iter 3) | 192.90 kB gzip; +22.83 kB = Radix AlertDialog + Checkbox runtime; UX-approved | [d8-restyle-review.md](qa/d8-restyle-review.md) §5 |
| DOB wire format (Iter 4) | UI displays DD/MM/YYYY; `dob` field submitted as ISO YYYY-MM-DD — product decision 2026-07-30, documented in ADR-0003 footnote | ADR-0003 |
| Minimum registration age 18 (Iter 4) | Supersedes spec §1.3/§2.3 draft value of 16; enforced in validation + datepicker year bounds — product decision 2026-07-30 | [iter4-spec.md amendment](ux/iter4-spec.md) |
| DobPicker lazy chunk (Iter 4) | react-day-picker heavy; code-split via `React.lazy` — 28.64 kB gzip async, loads on first picker open | `1dc7781` |
| Bundle baseline reset (Iter 4) | Main **195.04 kB gzip** (±2% band 191.1–198.9 kB); DobPicker async chunk 28.64 kB — reset in `532391d` | [iter4-review.md](qa/iter4-review.md) §1 |
| DOB entry is picker-only (canonical shadcn date-picker pattern); typed DD/MM/YYYY entry removed — supersedes iter4-spec §2.2 (owner decision 2026-07-30) | Ghost-icon-in-input trigger rejected as undiscoverable; shared `DatePickerField` + `DatePickerPopover` components adopted on RegisterPage + PendingRiders; ISO wire preserved; picker bounds unchanged | [iter4-spec.md amendment](ux/iter4-spec.md) §Iter 4.1 / `29099e3` / `6113b5c` |
| `ui/button.tsx` + `ui/calendar.tsx` rewritten (Iter 4.2 P1) — version-skew class of bug; H4-compliant full-file swap | `button.tsx` restored to `React.forwardRef` for React 18.3.1/Radix `asChild` compatibility; `calendar.tsx` classNames mapped to react-day-picker v8 CaptionDropdowns; fixed P1 + free-win F-4.2-01 | `ab2a32c` / `65e966b` |
| E2E smoke policy (Iter 4.2, owner-delegated, QA rec F-4.2-04, adopted 2026-07-30) | `npm run test:e2e` (Playwright Chromium, opt-in) is the pre-release gate for `ui/{button,popover,calendar,alert-dialog}`, `DatePickerField/Popover`, or any lazy Radix surface; NOT a default CI gate until ≥ 3 specs and < 60s (see Conventions/Gates note) | `54d1121` / [iter4-review.md](qa/iter4-review.md) §F-4.2-04 |
| Datepicker eager-bundled — lazy split removed (owner, 2026-07-30); revisit splitting at route level as app grows | At ~224 kB the micro-split premium (Suspense spinner + loader machinery) exceeded its value; `DatePickerPopover` + loader folded back into `DatePickerField` static imports; −146 net lines; single JS chunk; see D22 | `0f79f7e` / [iter4-review.md](qa/iter4-review.md) §Iter 4.4 |
| H1 contract amendment — `phoneNumber` → `phone` (2026-07-30) | Backend confirmed field rename; `RegisterPage`, `PendingRiders`, MSW handler, ADR-0003 contract table all updated same-commit (`b2cd8ce`); wire aliases `area`/`rideArea` + `activation_status`/`activated` honoured at boundary | ADR-0003 H1 amendment |
| All Riders admin table — hand-rolled engine (ADR-0004) | `/admin/all-riders`, Admin+Operator, `POST /GetAll/Riders` server-ready mock, RFC-4180 CSV, 7 cols, URL-persisted filters, sticky header, RiderDetailSheet | [ADR-0004](adr/0004-riders-data-table.md) |
| Bundle guard band reset to 221.5–224.5 kB (D24) | Radix Dialog entered bundle via Sheet primitive; `zlib.gzipSync` default-6 / Node `>=24 <25` is CI determinism anchor; old 219–227.9 band void | D24 |

---

## QA History

### C5 Review (2026-07-29)

| Finding | Sev | Resolution |
|---------|-----|------------|
| **F1** — Infinite redirect loop for unknown/Customer roles | BLOCKER | ✅ Fixed `8c22e86` |
| **F2** — `Admin` added to self-service ROLES | MAJOR | ✅ Fixed `8c22e86`; product question → D14 |
| **F3** — Operator "Active/Pending Riders" buttons were silent no-ops | MAJOR | ✅ Fixed `884a0a4` |
| **F4** — `login()` role-overwrite | Minor | ✅ Fixed `6b114d2` (D15 CLOSED) |
| **F5** — Post-register `navigate` pushes history | Minor | ✅ Fixed `6b114d2` (D16 CLOSED) |

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

### D8 Restyle Review (2026-07-30)

**Verdict:** ✅ SHIP. All gates green; H1/H2/H3/H4/H6/H7/H8 verified via targeted diff; all major a11y findings closed; bundle 192.90 kB gzip with plausible attribution; 5/5 documented deviations present in-file. F1–F3 are P3 trivia → D19/D20/D21. See `docs/qa/d8-restyle-review.md`.

### Iteration 4 Review (2026-07-30)

**Verdict:** ✅ **SHIP**. Gates at `532391d`: lint 0e/0w · typecheck 0 · typecheck:strict 0 · build 195.04 kB gzip (in band) · test 58/58. H1–H8 all respected. 3 INFO findings: F1 hash citation (docs-only), F2 spec age draft resolved by amendment in `docs/ux/iter4-spec.md`, F3 cursor rule improvement (no action). See `docs/qa/iter4-review.md`.

### Iteration 4.3 Perf Fix Review (2026-07-30)

**Verdict:** ✅ **SHIP**. Gates at HEAD `678d753`: lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **195.46 kB gzip** (in band) · test **55/55** · e2e 1/1. H1–H8 all 🟢. Bundle split preserved; loader-pattern (dedup, failure-reset, idle guard, keyboard) verified. See `docs/qa/iter4-review.md` §Iteration 4.3 addendum.

### Iteration 4.2 P1 Hotfix Review (2026-07-30)

**Verdict:** ✅ **SHIP**. Gates at HEAD `65e966b`: lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **195.31 kB gzip** (in band) · test **55/55** · e2e 1/1 smoke. H1–H8 verified; `asChild` blast-radius confirmed clean; free win F-4.2-01 (AlertDialogTrigger fix). See `docs/qa/iter4-review.md` §Iteration 4.2 addendum.

### Iteration 4.4 Datepicker Simplification Review (2026-07-30)

**Verdict:** ✅ **SHIP**. Gates at HEAD `0f79f7e`: lint 0e/0w · typecheck 0 · typecheck:strict 0 · build **223.43 kB gzip SINGLE chunk** (no async chunks) · test **55/55** · e2e 1/1. All lazy machinery (`React.lazy`, `Suspense`, `pickerMounted`, prefetch loader) removed from source. Every 4.1–4.3 behavioral contract preserved (dropdown-buttons caption, 1940..current-18 bounds, DD/MM/YYYY display, ISO wire, ARIA wiring, field-styling locks). Bundle baseline reset; old 191.1–198.9 kB band void; new band 219.0–227.9 kB. F-4.4-01 doc-only (stale JSDoc comment); F-4.4-02 recommend-only. See `docs/qa/iter4-review.md` §Iteration 4.4 addendum.

---

## Open Items — Deferred Work Register

| ID | Item | Owner | Priority |
|----|------|-------|----------|
| D1 | ~~DOB input uses `type="number"`~~ **CLOSED** — fixed `6b114d2` | — | Closed |
| D2 | ~~Invalid `autoComplete` attribute values~~ **CLOSED** — fixed `6b114d2` | — | Closed |
| D3 | ~~`Boolean` (object type) in `Profile` interface~~ **CLOSED** — folded into Profile unification `e84b920` (`online: boolean`) | — | Closed |
| D4 | ~~`RiderDashboard.tsx` self-import (`NavigateParams`)~~ **CLOSED** — fixed `e84b920` | — | Closed |
| D5 | ~~`ImageWithFallback.tsx` unimported — delete or adopt~~ **CLOSED** — route adapter split `fe6c64f` | — | Closed |
| D6 | ~~Unify `RiderDashboard` inline `Profile`; remove `@ts-nocheck`; flip `strict: true`~~ **CLOSED** — `e84b920` | — | Closed |
| D7 | Map library consolidation (Google Maps vs Leaflet) | Architect + PM | Backlog |
| D8 | ~~Adopt `components/ui/` (shadcn) in pages — restyle iteration~~ **CLOSED** — `57545a6`/`38c773b`/`1a6962f`/`f3e195d`; QA SHIP 2026-07-30 | — | Closed |
| D9 | ~~Auth session persistence~~ **CLOSED** — localStorage v1 envelope + 24h TTL shipped `0960516`. Remainder → D17 | — | Closed |
| D10 | ~~Dependency audit~~ **CLOSED** — 8 unused deps removed, react-router patched to ^7.18.2 (`6f4e165`) | — | Closed |
| D11 | `Customer` role — route/home destination undefined; `roleHome` falls back to `/login` + logout | Architect + PM | Backlog |
| D12 | ~~Reuse MSW handlers in Node for vitest/Playwright test suite~~ **CLOSED** — vitest + RTL + msw/node, 44 regression tests (`79ffdbc` + `2ac660b`) | — | Closed |
| D13 | Optional git-history rewrite to purge leaked `.env` — **optional / low-priority** (key rotated 2026-07-30; old history cosmetic only) | DevOps / PM | Low / Optional |
| D14 | **Product question:** should `Admin` be creatable via `/admin/register`? | PM + Product | Backlog |
| D15 | ~~`AuthProvider.login()` overwrites `profile.role`~~ **CLOSED** — normalized at boundary `6b114d2` | — | Closed |
| D16 | ~~Post-register `navigate("/login")` should use `{ replace: true }`~~ **CLOSED** — `6b114d2` | — | Closed |
| D17 | Token-based auth + server-side revocation + `/me` rehydrate (D9 remainder) — future ADR, backend contract pending | Backend + Frontend Dev | Backlog |
| D18 | PendingRiders live-endpoint migration (`POST /GetAll/UnregisteredRiders`) — mock-driven UX preserved; migrate when backend ready | Frontend Dev | Backlog |
| D19 | **[QA D8-F1/P3]** `--primary #0d8f6e` = 4.06:1 on white text — passes AA-Large / UI 3:1 but fails AA-normal 4.5:1. Options: (a) accept as documented Palette-A trade-off (already in `theme.css` comment), or (b) darken flat token to `#0a7c5f` (5.17:1) in a follow-up polish commit. Non-blocking; real button labels at 14px semibold are borderline "large text" per WCAG. | Frontend Dev + UX | Low |
| D20 | **[QA D8-F2/P3]** `RiderDashboard.tsx:2-3` top-comment says "Table body migration deferred to Phase 4" — stale post-Phase-4. Clarify comment to state native `<table>` is the final implementation (a11y met via `sr-only <caption>` + `scope="row"`; shadcn `<Table>` adds no semantic value here). Docs-only change, non-blocking. | Frontend Dev | Low |
| D21 | **[QA D8-F3/P3]** `PendingRiders.tsx:201,265` uses `tabIndex={-1}` on read-only display Inputs (Age, PIN). Correct by design (read-only; spec §2.3), but may confuse reviewers. Consider replacing with `<p>`/`<output>` styled to match for clearer semantics. Non-blocking. | Frontend Dev | Low |
| — | `npm audit` majors — `react-router v8` and `eslint v10` are major-version jumps; no critical CVEs in current versions; re-evaluate next hardening cycle | Frontend Dev | Backlog |
| — | Bundle-size tracking — main gzip baseline **223.12 kB** (Iter 5; single chunk); guard band = **221.5–224.5 kB** (D24; Node `>=24 <25`); async DatePickerPopover chunk no longer exists | Frontend Dev | Ongoing |
| — | `typecheck:strict` script is now redundant (same as `typecheck` since `strict: true`); candidate for a future chore to fold/remove | Frontend Dev | Low |
| D22 | Route-level code-splitting — revisit at ~300 kB gzip or heavy feature addition; seams documented | Frontend Dev + Architect | Backlog |
| D23 | XLSX export for All Riders table — needs `xlsx` (~90 kB) or D22-style chunk; defer until usage data | Frontend Dev + Architect | Backlog |
| D24 | Bundle-size band maintenance — new guard 221.5–224.5 kB; update whenever band deliberately shifts | Frontend Dev | Ongoing |
| D25 | Radix Sheet `Function components cannot be given refs` warning in test stderr — H4-locked; revisit if warning spreads | Frontend Dev | Low |
| **⚠️ OWNER DECISION** | D7 — Map lib consolidation: both `@react-google-maps/api` (RiderDashboard + RiderLocationView) and `react-leaflet` (ActiveRiders) live in app; team lean = Leaflet for frugality (~50 kB gzip saving); requires owner go-ahead | Architect + PM | **Pending** |
| **⚠️ OWNER DECISION** | D10 — shadcn primitive prune: only 10 of 47 `components/ui/` files used by app code; pruning 36 unused would unlock ~15 Radix packages (~80–120 kB gzip); H4-gated — owner sign-off required | Frontend Dev + PM | **Pending** |
| **Backend-blocked** | Rider mutation endpoints (approve/save/block), real `POST /GetAll/Riders`, D9-remainder (`/me` rehydrate), D15, D17 | Backend + Frontend Dev | Blocked |
| **Product Q** | D11 — Customer route/home destination; D14 — Admin creatable role via `/admin/register` | PM + Product | Backlog |
| **Uncommitted working tree** | Iteration 5 code/tests/docs in working tree; awaiting owner manual commits | Owner (dandkhan) | **In progress** |

---

## Conventions

| Convention | Detail |
|-----------|--------|
| Commit style | `chore/refactor/feat/fix/docs(scope): description`; every commit ends with all gates green |
| Quality gates | `npm run lint` (0 errors) · `npm run typecheck` (0 errors) · `npm run typecheck:strict` (0 errors) · `npm run build` · `npm test` (96 regression tests) — all required before merging. `test:e2e` (Playwright Chromium smoke, opt-in) — run before release whenever `src/components/ui/{button,popover,calendar,alert-dialog}`, `DatePickerField`/`DatePickerPopover`, or any lazy Radix surface changes; NOT part of the default 5 gates (QA rec F-4.2-04: revisit joining CI once ≥ 3 specs, < 60s) |
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
| ADR-0004: All Riders Admin Data Table | `docs/adr/0004-riders-data-table.md` |
| Migration Plan (C0–C7 + deferred register D1–D21) | `docs/design/migration-plan.md` |
| TypeScript Strict Mode Baseline | `docs/design/strict-errors.md` |
| UX Restyle Audit | `docs/ux/restyle-audit.md` |
| UX Restyle Spec | `docs/ux/restyle-spec.md` |
| QA C5 Review | `docs/qa/c5-review.md` |
| QA C6/C7 + D9 + Merge Review b0ef29c | `docs/qa/release-readiness.md` |
| QA D8 Restyle Review | `docs/qa/d8-restyle-review.md` |
| UX Iteration 4 Spec (+ product decisions amendment) | `docs/ux/iter4-spec.md` |
| QA Iteration 4 Review | `docs/qa/iter4-review.md` |
| MSW Developer Guide (seeds, contract, troubleshooting) | `src/mocks/README.md` |
