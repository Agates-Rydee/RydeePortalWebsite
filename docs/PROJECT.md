# PROJECT.md — RydeePortalWebsite

> **Last updated:** 2026-07-30 · Snapshot, not a log — rewrite stale sections.

---

## Overview

RydeePortalWebsite is a single-page React portal for the Rydee ride-hailing platform (DBX8 / MEU-FQA). It serves three active roles (Rider, Admin, Operator) with role-scoped dashboards and rider management screens. Stack: **React 18 + Vite 6 + TypeScript + Tailwind CSS 4 + shadcn/ui**, routing via **react-router 7** (library/browser mode), mock API via **MSW 2.x** (flag-gated), package manager **npm**. The backend is WIP elsewhere at `localhost:3000`; the API contract is frozen at `POST /user/login` (`{ phone, password }`) and `POST /register/user` (`{ name, email, phoneNumber, dob, address, password, role }`), `credentials: "include"`.

---

## Current State (as of 2026-07-30)

Iteration 4 — Form Validation, Datepicker, Cursor & UX Polish is **COMPLETE** (2026-07-30). Per-field on-blur + on-submit validation live on Login and Register (age 18–100, dob DD/MM/YYYY display → ISO submit); shadcn Calendar + Popover DOB datepicker (react-day-picker v8, lazy-loaded chunk); clickable StatCard as semantic `<button>`; cursor-pointer restored; PendingRiders select chrome fixed. All five quality gates green: lint 0 errors, typecheck 0 errors, typecheck:strict 0 errors, build clean, **58 regression tests passing**. Bundle baselines reset: main **195.04 kB gzip**; async DobPicker chunk **28.64 kB**.

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
| — | Bundle-size tracking — main gzip baseline **195.04 kB** (reset Iter 4); ±2% band = 191.1–198.9 kB; DobPicker async 28.64 kB | Frontend Dev | Ongoing |
| — | `typecheck:strict` script is now redundant (same as `typecheck` since `strict: true`); candidate for a future chore to fold/remove | Frontend Dev | Low |

---

## Conventions

| Convention | Detail |
|-----------|--------|
| Commit style | `chore/refactor/feat/fix/docs(scope): description`; every commit ends with all gates green |
| Quality gates | `npm run lint` (0 errors) · `npm run typecheck` (0 errors) · `npm run typecheck:strict` (0 errors) · `npm run build` · `npm test` (58 regression tests) — all required before merging |
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
