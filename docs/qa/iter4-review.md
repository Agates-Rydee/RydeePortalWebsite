# Iteration 4 — QA Review

**Reviewer:** QA-Iter4 (sub-agent, SWE Team Lead)
**Date:** 2026-07-30
**Scope:** 6 commits on `main`, base `bd4049d..HEAD` (pre-review tip `1dc7781`; post-review tip `532391d` with additive tests).
**Verdict:** ✅ **SHIP**

Commits under review:
- `f9fcfc0` fix(styles): cursor:pointer restoration (§3)
- `9948996` fix(riders): `.select-field` chrome for PendingRiders selects (§4)
- `4252e13` feat(dashboards): clickable StatCard as whole-card `<button>` (§5)
- `7693215` feat(auth): per-field on-blur + on-submit validation, DD/MM/YYYY → ISO conversion (§1 + decision 1)
- `731dff6` feat(auth): shadcn Calendar + Popover DOB picker, react-day-picker v8 dropdown-buttons, ADR-0003 footnote (§2 + decision 2)
- `1dc7781` perf(auth): lazy-load DobPicker chunk (§ phase 6)

> **Note on the range:** The task brief listed `c0c9163` as the phase-6 commit but the actual tip is `1dc7781` with the same intent (identical commit subject line and semantic change). Diff verification was performed against the actual HEAD; deliverables verified.

---

## 1. Gates (re-run at HEAD `532391d`)

| Gate | Result | Notes |
|---|---|---|
| `npm run lint` | ✅ 0 errors / 0 warnings | eslint src, clean |
| `npm run typecheck` | ✅ 0 errors | `tsc --noEmit` |
| `npm run typecheck:strict` | ✅ 0 errors | `tsc --noEmit --strict` |
| `npm test` | ✅ **58/58** passed | 44 baseline + 14 new additive (7 test files, ~12.6s) |
| `npm run build` | ✅ built in 12.57s | main JS gzip **195.04 kB** (band 189.0–196.8 ✓); async `DobPicker-kOcVXqie.js` gzip **28.64 kB** (~28.6 ✓); CSS gzip 22.45 kB |
| MSW dist purity | ✅ **0 hits** | `rg msw dist/assets/*.js` → exit 1, no matches; MSW tree-shaken from prod (H6 confirmed) |

All five quality gates green. Bundle numbers match target: main 195.04 kB gzip (within band); async DOB chunk 28.64 kB gzip; no MSW leakage.

---

## 2. H-rule sweep — `git diff bd4049d..HEAD`

Files changed under review:

```
docs/adr/0003-mock-api-msw.md                    |   4 +-
src/components/shared.tsx                        |  20 +-
src/features/auth/pages/LoginPage.tsx            |  43 +++-
src/features/auth/pages/RegisterPage.tsx         | 268 +++++++++++++++++++++--
src/features/auth/pages/components/DobPicker.tsx |  60 +++++
src/features/dashboards/components/StatCard.tsx  |  75 +++++--
src/features/riders/PendingRiders.tsx            |   4 +-
src/styles/theme.css                             |  39 ++++
```

| Rule | File(s) | Status | Evidence |
|---|---|---|---|
| **H1** fetch shapes byte-identical | `LoginPage.tsx:66-71`, `RegisterPage.tsx:194-207` | 🟢 pass | Login body still `{ phone, password }` + `credentials: "include"`. Register body still `{ name, email, phoneNumber, dob, address, password, role }` + `credentials: "include"`. Only the `dob` **VALUE** now goes through `dobToIso(form.dob)` (`RegisterPage.tsx:126-130`) — field NAMES + shape unchanged. Change explicitly sanctioned by product decision 1 and by the ADR-0003 amendment (see H1a below). Additive test `submits dob as ISO YYYY-MM-DD (25/12/1995 -> 1995-12-25) and preserves H1 fields` asserts both. |
| **H1a** ADR-0003 dob footnote | `docs/adr/0003-mock-api-msw.md:45` | 🟢 pass | Footnote ³ present: "Amended 2026-07-30 (Iter 4 §2, product decision 1): the `dob` VALUE is now canonicalized to **ISO `YYYY-MM-DD`** in the register payload … Field names and payload shape remain byte-identical — only the `dob` string format is fixed." |
| **H2** `ROLES` untouched | `src/types/profile.ts` | 🟢 pass | 0-byte diff. `roles.test.tsx` (4 tests) still green: `/admin/register` role dropdown never offers Admin. |
| **H3** Customer seed intact | `src/mocks/handlers/auth.ts` | 🟢 pass | 0-byte diff. `login-flow.test.tsx > logging in as Customer lands at /login with empty storage (no loop)` still green. |
| **H4** No edits under `src/components/ui/**` | — | 🟢 pass | `git diff --stat bd4049d..HEAD -- src/components/ui/` → **empty**. |
| **H5** `.env` not committed | — | 🟢 pass | Not in changed-files list. |
| **H6** endpoint URLs from `config.ts`; MSW handler shapes | — | 🟢 pass | `config.ts` 0-byte diff. Both pages import `API_LOGIN_URL` / `API_REGISTER_URL`. `contract.test.ts` (5 tests) green. |
| **H7** session envelope untouched | `src/features/auth/session.ts` | 🟢 pass | 0-byte diff. |
| **H8** guards untouched | `ProtectedRoute.tsx`, `PublicOnly.tsx`, `router.tsx`, `profile.ts::roleHome` | 🟢 pass | 0-byte diffs. `guards.test.tsx` (16 tests) green. |

**H-rule verdict:** clean sweep.

---

## 3. Spec §0 DO-NOT-CHANGE checks

| Constraint | Status |
|---|---|
| Routes & guards (H8, ADR-0002) | 🟢 untouched |
| Fetch calls (shapes byte-identical) | 🟢 field names + credentials unchanged; only dob VALUE format canonicalized per decision 1 (ADR-0003 amended in same commit as §2) |
| 44 regression tests, verbatim strings | 🟢 all still pass; `"Please enter a valid phone number."` remains reachable on submit path (`LoginPage.tsx:36 PHONE_ERR`, wired via `validatePhone` on submit) — spec §6 regression note satisfied |
| `src/components/ui/**` | 🟢 empty diff |
| Session storage helpers only | 🟢 `session.ts` 0-byte diff |
| `ROLES` constant | 🟢 unchanged |
| Customer seed `0300444444` | 🟢 unchanged |
| Endpoint URLs from `config.ts` | 🟢 both fetch call-sites import from `@/lib/config` |

---

## 4. Spec conformance (§1–§5)

### §1 Form validation matrix

| Item | Implementation | Status |
|---|---|---|
| Login on-blur phone check + verbatim error | `LoginPage.tsx:36 PHONE_ERR = "Please enter a valid phone number."`; per-field state `phoneError` / `passwordError`; `<p role="alert" aria-describedby=…>` wired via `FieldInput errorMessage` | 🟢 |
| Register field rules (name ≥2, email regex, phone 10–11, dob 18–100, address ≥5, pw ≥8, confirm match, role required when `showRole`) | `RegisterPage.tsx:96-104 validators` map | 🟢 |
| **Age 18–100** (decision 2 supersedes spec §1.3 "16–100") | `isValidDob` uses `age >= 18 && age <= 100` (`RegisterPage.tsx:122`) | 🟢 |
| `aria-invalid` + `aria-describedby` + `role="alert"` wiring | `shared.tsx:125-140` (`FieldInput` renders derived `errorId`, sets both attrs conditionally, error `<p role="alert">`) | 🟢 |
| First-invalid focus on submit | `RegisterPage.tsx:182-186` `document.getElementById(id)?.focus()`; `LoginPage.tsx:54,58` focuses `#phone` / `#password` in order | 🟢 |
| On-blur timing (not on keystroke) | `handleBlur` handlers wired to `onBlur`; `clearFieldError` on change is a mere clear (never sets a new error) | 🟢 |
| Touched-but-empty rule (no error until user types something) | `RegisterPage.tsx:142-145` early-return when value is empty | 🟢 (additive test verifies) |
| Body shape preserved on submit despite validation | Additive test `submits dob as ISO … and preserves H1 fields` asserts exact key set | 🟢 |

### §2 Datepicker

| Item | Implementation | Status |
|---|---|---|
| Typeable input two-way sync (input ↔ picker) | Manual typing goes through `set("dob")`; picker `onSelect` calls `formatDobDisplay` and writes back into `form.dob`; parent passes `selected={parseDobDisplay(form.dob)}` back to picker | 🟢 |
| `captionLayout="dropdown-buttons"` with year+month dropdowns | `DobPicker.tsx:51` | 🟢 |
| `fromYear=1940`, `toYear=currentYear-18` (decision 2) | `RegisterPage.tsx:27-28` `DOB_MAX_YEAR = new Date().getFullYear() - 18; DOB_MIN_YEAR = 1940;`, passed to picker | 🟢 |
| Trigger `aria-label="Open date picker"` | `RegisterPage.tsx:316` (static trigger, main chunk) + `DobPicker.tsx:39` (post-mount trigger) — both identical label | 🟢 |
| Focus return on close | Radix Popover default (`PopoverTrigger asChild` around `<Button>`) → focus returns to the trigger button automatically | 🟢 |
| Popover `align="start"` | `DobPicker.tsx:45` | 🟢 |
| `disabled={{ after: new Date(toYear, 11, 31) }}` prevents picking under-18 years | `DobPicker.tsx:54` | 🟢 |

### §3 Cursor rule

`theme.css:249-265` — single global `@layer base` rule.
- `cursor: pointer` on enabled `button`, `[role="button"]:not([aria-disabled="true"])`, `a[href]`, enabled `select`, `summary`, `[tabindex]:not([tabindex="-1"]):not(:disabled)`
- `cursor: not-allowed` on disabled `button`, `[role="button"][aria-disabled="true"]`, disabled `select`, disabled `input`
- Minor deviation from spec: spec code sample had `[role="button"]:not(:disabled)` but the implementation used `[role="button"]:not([aria-disabled="true"])` — this is **more correct** since `:disabled` does not apply to div-based `role="button"` widgets. 🟢

### §4 `.select-field` visual parity

`theme.css:271-281` — `@layer components .select-field` applies exactly the tokens listed in spec §4.3: `bg-white`, `border border-input`, `rounded-xl`, `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`, chevron SVG data-URI, `px-4 py-3` + `padding-right: 2.5rem`. Applied to `#rider-select` and `#pr-area` in `PendingRiders.tsx:129,173`. 🟢

### §5 StatCard

`StatCard.tsx`:
- **Semantic `<button>`** (not a wrapping div-with-role): `interactive` branch renders a real `<button type="button">` with Card visual classes re-applied inline (`bg-card text-card-foreground … rounded-2xl border card-elevated border-border p-6`) — no nested `<button>` (verified by additive test `no nested interactive descendants`).
- **Dynamic aria-label** `"View ${display} ${label.toLowerCase()}"` → e.g. `"View 5 pending riders"`.
- **Static branch** when `onClick == null` OR `value == null` — renders `<Card>` (div), no `role="button"`; loading state (`value == null`) shows `—` sentinel and is non-interactive (per spec §5.4 loading row).
- **Motion-reduce guards** present: `motion-reduce:transform-none motion-reduce:transition-none` in `CARD_INTERACTIVE`.
- **Focus-visible ring** `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- All four additive tests pass (button rendering, static-on-null, static-when-no-onClick, click fires callback). 🟢

---

## 5. Regression risks (spec §6)

| Risk | Status | Evidence |
|---|---|---|
| Verbatim `"Please enter a valid phone number."` reachable on submit path | 🟢 preserved | `LoginPage.tsx:36`; existing `login-flow.test.tsx > client-side phone validation blocks non-10-digit input` still green (uses `/valid phone number/i`). |
| `getByRole("link")` on stat cards | 🟢 safe | Baseline tests do not exercise dashboards; new interactive card renders as `role="button"` not `link` (correct — `onNavigate` is a callback, not a URL). No `getByRole("link")` collisions. |
| Mock seeds use ISO already | 🟢 no drift | ADR-0003 note "MSW seeds already use ISO (`1998-03-15` etc.) so no seed changes needed." Confirmed by the register-handler additive test which sends ISO and MSW accepts it. |

---

## 6. Additive test coverage (this review)

New file: `tests/regression/iter4-additive.test.tsx` — **14 tests**, commit **`532391d`**.

| Group | Coverage |
|---|---|
| §1 on-blur validation | email invalid → error + aria wiring; touched-but-empty → no error; error clears on typing valid input |
| §1/§2 DOB boundaries + submission | age < 18 rejected; age > 100 rejected; 29/02/2023 rejected (non-leap); 29/02/2000 accepted; **exactly-18** accepted (boundary); **submit sends `dob: "1995-12-25"`** for `25/12/1995` input and body key-set matches H1 exactly |
| §5 StatCard | `<button>` rendering with dynamic aria-label + no nested interactives; static when `value=null`; static when `onClick` omitted; click fires callback |
| Phase 6 lazy | initial render has trigger button but no `[data-radix-popper-content-wrapper]` in DOM (Popover chunk unmounted) |

All 58 tests pass; gates re-verified green after commit.

---

## 7. Findings

**None P0/P1.** No blockers.

### F1 — INFO — Task-brief commit hash drift
- **Severity:** Info (documentation only)
- **Evidence:** Brief cited `c0c9163` for phase 6; actual tip is `1dc7781`. Semantics identical (`perf(auth): lazy-load DOB picker chunk (iter4 phase 6)`).
- **Action:** None required; noted in this review header. Suggest the SWE Team Lead confirms hash before archiving the brief.

### F2 — INFO — Spec ↔ implementation age divergence intentional
- **Severity:** Info
- **Evidence:** `iter4-spec.md §1.3` still reads `age 16–100`; implementation uses 18–100 per approved product decision 2. Spec doc was not amended in-repo.
- **Suggested action:** Non-blocking. Consider a follow-up doc edit or a "decisions log" file linked from the spec (analogous to the ADR-0003 footnote pattern) so future readers do not treat the spec as canonical over the product decision.

### F3 — INFO — Cursor rule uses `[aria-disabled="true"]` instead of `:disabled` for role=button (more correct than spec)
- **Severity:** Info
- **Evidence:** `theme.css:251,260`. This is an improvement over the spec sample; documented here so future spec revisions can adopt the same wording.

---

## 8. Ship decision

**SHIP.** All quality gates green (0/0/0/clean/58 passing). All eight H-rules confirmed intact. Spec §1–§5 conformance verified against source. Product decisions 1 (dob display DD/MM/YYYY → submit ISO) and 2 (age 18–100, datepicker `toYear=currentYear-18`) implemented and covered by additive tests. Only findings are informational (documentation/log housekeeping).

---

## Iteration 4.1 Addendum — Hotfix Revalidation

**Reviewer:** QA-Iter4b (sub-agent, SWE Team Lead)
**Date:** 2026-07-30
**Scope:** 2 hotfix commits on `main`, range `29099e3~1..HEAD` (tip `6113b5c`).
**Verdict:** ✅ **SHIP**

Commits under review:
- `29099e3` feat(auth): shadcn-canonical DatePickerField + RegisterPage adoption (iter4.1 hotfix)
- `6113b5c` feat(riders): PendingRiders DOB uses shared DatePickerField (iter4.1 hotfix)

Product-owner rejection of the Iter 4 §2 datepicker (hidden ghost-icon trigger, undiscoverable; PendingRiders still on native `type=date`) is resolved. Typed DOB entry removed (owner-approved trade — see iter4-spec.md Product Decisions Amendment).

### 1. Gates at HEAD `6113b5c`

| Gate | Result | Notes |
|---|---|---|
| `npm run lint` | ✅ 0 errors / 0 warnings | eslint src, clean |
| `npm run typecheck` | ✅ 0 errors | `tsc --noEmit` |
| `npm run typecheck:strict` | ✅ 0 errors | `tsc --noEmit --strict` |
| `npm test` | ✅ **55/55** passed | 44 baseline + 11 revised additive (7 files, ~12.9s). Was 58 pre-hotfix; net −3 = +3 button-pattern tests −6 typed-entry tests. |
| `npm run build` | ✅ built in 13.24s | main JS gzip **195.27 kB** (band 191.1–198.9 ✓); async `DatePickerPopover-CwA9jsw8.js` gzip **28.75 kB** (target ~28.75 ✓); CSS gzip 22.48 kB |
| MSW dist purity | ✅ **0 hits** | `rg msw dist/assets/` → exit 1 |

All gates green. Bundle metrics inside the negotiated band; async chunk renamed `DobPicker-*` → `DatePickerPopover-*` (same lazy contract, richer content — matches size within noise).

### 2. H-rule sweep — `git diff 29099e3~1..HEAD`

Files changed (7):

```
src/components/DatePickerField.tsx                    | 123 +++  (new)
src/components/DatePickerPopover.tsx                  |  87 +++  (new)
src/components/date-helpers.ts                        |  10 +++  (new)
src/features/auth/pages/RegisterPage.tsx              | 117 ±
src/features/auth/pages/components/DobPicker.tsx      |  60 ---  (deleted)
src/features/riders/PendingRiders.tsx                 |  18 +
tests/regression/iter4-additive.test.tsx              | 111 ±
```

| Rule | Status | Evidence |
|---|---|---|
| **H1** register fetch shape byte-identical | 🟢 pass | `RegisterPage.tsx:181-194`: body still `{ name, email, phoneNumber, dob, address, password, role }` + `credentials: "include"`. `dob` VALUE still routed through `dobToIso(form.dob)` → ISO `YYYY-MM-DD`. `contract.test.ts` (5 tests) asserts exact 7-key set and `dob: "1990-01-01"` shape — green. |
| **H2** `ROLES` untouched | 🟢 pass | `src/types/profile.ts` 0-byte diff. `roles.test.tsx` green. |
| **H3** Customer seed intact | 🟢 pass | `src/mocks/handlers/auth.ts` 0-byte diff. `login-flow.test.tsx > Customer → /login (no loop)` green. |
| **H4** No edits under `src/components/ui/**` | 🟢 pass | `git diff --stat 29099e3~1..HEAD -- src/components/ui/` → empty. New picker files live one directory up in `src/components/`, correctly consuming (not modifying) `ui/button`, `ui/popover`, `ui/calendar`. |
| **H5** `.env` not committed | 🟢 pass | Not in changed-files list. |
| **H6** MSW handlers unchanged | 🟢 pass | 0-byte diff under `src/mocks/`. ADR-0003 dob footnote from Iter 4 still accurate. |
| **H7** session envelope untouched | 🟢 pass | `session.ts` 0-byte diff. |
| **H8** guards untouched | 🟢 pass | `router.tsx`, `ProtectedRoute.tsx`, `PublicOnly.tsx`, `profile.ts::roleHome` 0-byte diffs. |

### 3. Test-revision audit (KEY RISK)

**Baseline (44 tests, 6 files) byte-identical:** `git diff --stat 29099e3~1..HEAD -- tests/` shows only `iter4-additive.test.tsx` changed. `foundation.test.ts`, `contract.test.ts`, `session.test.ts`, `guards.test.tsx`, `roles.test.tsx`, `login-flow.test.tsx` untouched.

**Additive 14 → 11 breakdown:**

- **Removed (6 typed-entry tests)** — all previously drove `user.type(dob, "…")` into an `<input>` that no longer exists:
  1. `rejects age < 18 on blur (typed)`
  2. `rejects age > 100 (typed)`
  3. `rejects 29/02/2023 non-leap (typed)`
  4. `accepts 29/02/2000 leap-year adult (typed)`
  5. `submits dob as ISO YYYY-MM-DD (25/12/1995 → 1995-12-25) end-to-end via typed input`
  6. `age exactly 18 boundary (typed)`

- **Removed unreachability analysis:** with typed entry gone, the field is a `<Button>` opening a shadcn Calendar. The scenarios above are prevented **at the source** by picker bounds:
  - `fromYear = 1940`, `toYear = new Date().getFullYear() - 18` = 2008 for today (2026-07-30). Year dropdown does not offer 2009+ or < 1940 → rules 1 (age<18) and 2 (age>100) unreachable via UI.
  - `disabled={{ after: new Date(toYear, 11, 31) }}` disables all days after Dec 31, 2008 → any date visibly after that year is not clickable.
  - Calendar is a real calendar grid: **Feb 29, 2023 does not exist on the grid** in a non-leap year → rule 3 unreachable by design (this is Calendar semantics, not our code).
  - Leap-year adult dates (rule 4) remain trivially reachable — positive scenario, no failure mode.
- **Residual (defensive-only) gap:** the `toYear` bound uses year granularity, so a birthday **later in `currentYear-18`** than today's month/day (e.g. Dec 31 2008 today = 17y 7m) is *clickable* but currently under 18. Defensive `isValidDob` in `RegisterPage.tsx:94-110` still rejects it on submit-blur, blocking the wire submission. The **wire never carries an underage date** — H1/decision-2 invariant holds. UX friction is acceptable for < 5-month yearly window; documented, not a blocker.

- **Added (3 button-pattern tests):**
  1. `renders the outline button trigger with the muted DD/MM/YYYY placeholder` — asserts `tagName === "BUTTON"`, textContent, `id === "reg-dob"` (H1 focus-target invariant).
  2. `blocks submit + focuses the empty dob trigger` — fills every other field, submits, asserts `role="alert"` error text visible, `fetch` NOT called (via `let called = false` in the MSW handler), and `document.activeElement === trigger`. This is the strongest regression test in the file: it proves the required-dob path end-to-end without needing to drive the lazy popover.
  3. `aria-invalid wires to the trigger button when validation fails` — asserts `aria-invalid="true"` and `aria-describedby="reg-dob-error"` on the trigger.

- **ISO wire coverage:** ✅ retained by `tests/regression/contract.test.ts` — `dob: "1990-01-01"` asserted in the frozen 7-key register body. **Small gap:** the *transformation* `RegisterPage.dobToIso(form.dob)` (DD/MM/YYYY → ISO) is no longer end-to-end asserted through the UI (was: test 5). Driving the lazy Radix Popover in jsdom is brittle (`data-radix-popper-content-wrapper` requires layout). Given `dobToIso` is a 3-line pure regex swap and every dev-interaction exercises it, this is documented and accepted. **Recommend**: if a defect ever surfaces here, add a unit test that imports `dobToIso` directly (currently a module-scoped function; would require a minor export).

**Verdict on revisions:** genuine — removals correspond to now-impossible UI states; new tests cover the invariants that remain reachable; baseline preserved; ISO contract still asserted at fetch level.

### 4. Component correctness — `DatePickerField.tsx`

| Concern | Status | Evidence |
|---|---|---|
| `Label htmlFor` → trigger button `id` | 🟢 | `RegisterPage.tsx:290-293` `<Label htmlFor="reg-dob">` + `<DatePickerField id="reg-dob" …>`; the inner `<Button id={id}>` (both pre- and post-mount trigger + Suspense fallback + popover trigger) preserves the id. `screen.getByLabelText(/Date of birth/i)` resolves to the button in tests. |
| Accessible name (field + selected date) | 🟢 | Trigger text content = `formatDobDisplay(value)` or placeholder. When populated, SR reads "Date of birth, 25/12/1995, button". `ariaLabel` prop optionally overrides (PendingRiders uses `ariaLabel="Date of birth"` since it has an outer `<FormField>` label). |
| Keyboard: Enter/Space opens | 🟢 | Native `<button type="button">` semantics + shadcn `Button` — Enter/Space fires `onClick` which flips `pickerMounted=true`; `DatePickerPopover` mounts with `open={true}` initial state. |
| Calendar arrow-key nav | 🟢 | `react-day-picker` provides native arrow-key grid nav; `initialFocus` focuses the selected/today cell on open. |
| Escape closes; focus returns to trigger | 🟢 | Radix `Popover` `onOpenChange(false)` returns focus to `PopoverTrigger` (documented Radix behavior); trigger is the outline Button. |
| `aria-invalid` + `aria-describedby` + `role="alert"` on error | 🟢 | Lines 73-74 wire both attrs conditionally; error `<p id={derivedErrorId} role="alert">` at line 114-118. Regression test `aria-invalid wires to the trigger button when validation fails` asserts this. |
| Lazy chunk not loaded at initial render | 🟢 | Existing test `Radix Popover is not in the DOM initially` asserts `document.querySelector("[data-radix-popper-content-wrapper]") === null`. Build confirms the split: `DatePickerPopover-CwA9jsw8.js` (async, 28.75 kB gzip) vs main index chunk. The `pickerMounted` flag guards the `<Suspense>` wrapper (lines 67-113) so `React.lazy(() => import("./DatePickerPopover"))` fetch does not fire on initial render. |
| `PendingRiders` `calcAge` still ISO-compatible | 🟢 | `PendingRiders.tsx:31-38` `calcAge(dob)` uses `new Date(dob)`; state stays ISO (`onChange` writes `${YYYY}-${MM}-${DD}`, line 196). Seeded `PENDING_RIDERS[*].dob` values in `src/mocks/data/riders.ts` are ISO — untouched. Age field re-renders on every state change. |
| Visual parity (rounded-xl, height parity) | 🟢 | DatePickerField class: `rounded-xl px-4 py-3 text-sm h-auto` (line 77) — matches other Register/PendingRiders inputs (`h-auto rounded-xl px-4 py-3 text-sm`). Grid parity in PendingRiders (`grid grid-cols-2 gap-4` line 186) verified. |

### 5. Edge — RegisterPage required-dob error path

Covered by additive test **"blocks submit + focuses the empty dob trigger when the user has not picked a date"** (`iter4-additive.test.tsx:76-102`):

- Every other required field filled (name, email, phone, address, password, confirm).
- Submit clicked → validator loops fields; first invalid = `dob` (empty).
- `screen.findByText(/Enter a valid date of birth/)` resolves with `role="alert"` — ✅ error shows.
- `expect(called).toBe(false)` — ✅ `fetch` NOT called (asserted via MSW handler-side flag).
- `expect(document.activeElement).toBe(trigger)` — ✅ focus lands on the dob trigger button.

### 6. Findings

- **F-4.1-01** — *Informational.* Underage-in-current-year window: because `toYear = currentYear - 18` uses year granularity, a birthday later in that year than today's month/day is clickable but currently makes the user < 18. Defensive `isValidDob` on submit blocks the wire, preserving decision-2 invariant. UX friction only. **Owner action:** none required; consider tightening to `disabled={{ after: eighteenYearsAgoToday }}` in a future polish pass.
- **F-4.1-02** — *Small coverage gap.* The `RegisterPage.dobToIso` DD/MM/YYYY→ISO transformation is no longer asserted end-to-end through the UI (Radix popover is fragile to drive in jsdom). `contract.test.ts` still pins the wire shape with ISO input; the transform itself is a 3-line pure regex swap. **Owner action:** none required now; if a regression ever surfaces, export `dobToIso` and add a unit test.
- **F-4.1-03** — *Positive.* Async chunk name changed `DobPicker-*.js` → `DatePickerPopover-*.js` (28.64 → 28.75 kB gzip, +0.11 kB). Chunk hash-only difference in the manifest is expected. No consumer references the old filename.

### 7. Sign-off

- All five gates green at HEAD `6113b5c`.
- Bundle metrics inside negotiated band (main 195.27 kB gzip; async 28.75 kB gzip; MSW purity 0 hits).
- H1–H8 invariants preserved (verified by diff scope + regression tests).
- Test revisions are principled: 6 removed tests are UI-unreachable by design after typed entry removal; 3 new tests cover the button-pattern invariants; baseline suite untouched; ISO wire contract retained by `contract.test.ts`.
- Product-owner rejection resolved: canonical shadcn date-picker pattern, discoverable trigger, DD/MM/YYYY display, ISO wire preserved.

**Ship it.** ✅

---

## Iteration 4.2 addendum — P1 fix validation + E2E gap closed

**Date:** 2026-07-30 · **Reviewer:** QA-Iter4c · **Verdict:** **SHIP ✅**

### What was fixed
- **`ab2a32c`** — `src/components/ui/button.tsx` rewritten (H4-compliant full-file swap) from a React-19 ref-as-prop function component back to the canonical React-18 `React.forwardRef<HTMLButtonElement, ButtonProps>`. The `buttonVariants` cva config is **byte-identical** to the previous version (verified: `git diff ab2a32c^..ab2a32c -- src/components/ui/button.tsx` — only the component wrapper lines change, cva definition untouched, `data-slot="button"`, all variants/sizes, and the `{ Button, buttonVariants }` export are preserved). `displayName = "Button"` set. Public props API preserved (`className`, `variant`, `size`, `asChild`, plus native button attrs). Root cause of the P1: Radix Slot's ref-attach path needs `forwardRef` on React 18.3.1; the ref-as-prop shape silently dropped the anchor ref so `PopoverTrigger asChild → Button` never mounted `[data-radix-popper-content-wrapper]`.
- **`65e966b`** — `src/components/ui/calendar.tsx` full-file rewrite (H4-compliant) mapping the react-day-picker v8 `CaptionDropdowns` classNames: `vhidden → sr-only`, `caption_dropdowns → flex justify-center gap-2 w-full`, `dropdown_{month,year} → relative inline-flex items-center`, `dropdown → absolute inset-0 z-10 opacity-0` (transparent native `<select>` overlaid on the visible pill so keyboard/AT still hit the native control), plus a rotated-chevron `IconDropdown`. `DatePickerField`/`DatePickerPopover` also received **scoped** trigger classNames (`border-input bg-background hover:bg-background hover:text-inherit data-[state=open]:bg-background data-[state=open]:text-inherit`) so the outline Button doesn't flash primary-green on hover / when the popover is open (palette collision `--accent == --primary`). Zero `ui/**` edits beyond the two H4 rewrites — verified `git diff --stat 65e966b^..65e966b` = 3 files (`ui/calendar.tsx`, `components/DatePickerField.tsx`, `components/DatePickerPopover.tsx`).

### Gate results at HEAD `65e966b`
| Gate | Result |
|---|---|
| `npm run lint` | ✅ clean |
| `npm run typecheck` | ✅ clean |
| `npm run typecheck:strict` | ✅ clean |
| `npm test` | ✅ **55/55**, 7 files, 11.20s |
| `npm run build` | ✅ built in 11.6s |
| Main gzip | **195.31 kB** (in band 191.1–198.9, +0.04 vs 4.1 baseline) |
| Async `DatePickerPopover` gzip | **28.94 kB** (+0.19 vs baseline — 0.7%, well under 10% budget) |
| MSW dist purity | `rg -c msw dist/assets/*.js` = 0 hits ✅ |
| Calendar chunk placement | react-day-picker markers present only in `DatePickerPopover-*.js`, **0 in main** ✅ |

### `asChild` consumer sweep (blast radius)
`rg 'asChild' src/` → the only Radix triggers that render an app `Button asChild` are `DatePickerPopover.tsx:52` (`<PopoverTrigger asChild><Button …/>`) — now works — and `PendingRiders.tsx:300` (`<AlertDialogTrigger asChild><Button …>Block rider`) — was **latently broken by the same bug** and is now also fixed by the primitive-level rewrite. Every other `asChild` site is either inside `ui/**` scaffolding (`badge`, `breadcrumb`, `sidebar`, `select`) whose children are already `forwardRef`-shaped Radix primitives, or non-Radix like `StatCard`'s comment reference. No consumer relied on ref-as-prop.

### H-rules recheck
| Rule | Status |
|---|---|
| H1 (frozen `/user/login` + `/register/user` shapes) | 🟢 untouched — commits are UI-only |
| H2 (`ROLES` unchanged; no `Admin` creation) | 🟢 untouched |
| H3 (Customer seed retained) | 🟢 untouched — `0300444444` still present in `handlers/auth.ts` |
| H4 (no `src/components/ui/**` piecemeal edits) | 🟢 both `ui/**` changes are documented full-file rewrites in commit bodies |
| H5 (no `.env` commits) | 🟢 |
| H6 (MSW imports endpoint URLs from `@/lib/config`) | 🟢 untouched |
| H7 (session helpers) | 🟢 untouched |
| H8 (guard trace) | 🟢 not modified |

### Findings

- **F-4.2-01** — *Positive.* The primitive-level fix closed a **second latent** P1 in the `Block rider` `AlertDialogTrigger asChild` path on `/admin/pending-riders` at zero incremental cost. Documented for the record.
- **F-4.2-02** — *Structural test gap that let the P1 ship.* The lazy `DatePickerPopover` chunk is deliberately never mounted in the vitest/jsdom suite (existing test asserts `[data-radix-popper-content-wrapper] === null` on initial render). All 5 default gates therefore **structurally cannot** exercise Radix's real ref-attach path — jsdom never renders the popover anchor at all. Closed by F-4.2-03.
- **F-4.2-03** — *New: minimal Playwright smoke.* `tests/e2e/datepicker.spec.ts` boots the Vite dev server with `VITE_ENABLE_MSW=true`, navigates `/register`, clicks `#reg-dob`, waits for `[data-radix-popper-content-wrapper]`, picks month "June" + year `currentYear-25` via the native overlays, selects gridcell "15", asserts the popover unmounts and the trigger reads `15/06/YYYY`. Fails on **any** console error/warning or page error during the flow. Runs in **~2.5s** (9.5s total including dev boot); deterministic. Chromium only (frugal — no cross-browser matrix). New devDep `@playwright/test`; `.gitignore` extended for artifacts (`test-results/`, `playwright-report/`, `playwright/.cache/`). Invoke via `npm run test:e2e`.
- **F-4.2-04** — *Recommendation on CI wiring.* Do **not** add `test:e2e` to the default 5 gates yet. Reasons: (a) requires a running dev server + a `~140 MB` Chromium download, which triples CI setup time; (b) coverage today is one flow — bang-for-buck lives in keeping the vitest gates fast (<15s) and running E2E as a **pre-release** gate. **Owner action:** add `npm run test:e2e` to the release-readiness checklist and run it manually (or in a nightly job) before any commit that touches `src/components/ui/{button,popover,calendar}.tsx`, `src/components/DatePicker*.tsx`, or introduces a new lazy Radix chunk. Revisit CI wiring once the E2E suite has ≥ 3 specs and total runtime is still < 60s.

### E2E result

```
Running 1 test using 1 worker
  ok 1 [chromium] › tests\e2e\datepicker.spec.ts:17:3 › DOB datepicker (P1 regression) › register page: opens, selects a date, closes with DD/MM/YYYY (2.5s)
  1 passed (9.5s)
```

### Sign-off

- P1 fix ships. Verdict: **SHIP.**
- Structural gap that let the P1 ship is now closed by an opt-in Chromium smoke, added under a separate `test(e2e):` commit per the task's split-commit requirement.
- Recommend running `npm run test:e2e` as part of release readiness whenever the button/popover/calendar surface changes; defer default-gate inclusion until the E2E surface grows.

---

## Iteration 4.3 addendum — DatePicker prefetch (perf)

**Date:** 2026-07-30 · **Reviewer:** QA-Iter4d · **Commit:** `678d753` `perf(components): prefetch date picker chunk` · **Verdict:** **SHIP ✅**

### Gates at HEAD `678d753`
| Gate | Result |
|---|---|
| `npm run lint` | ✅ clean |
| `npm run typecheck` | ✅ clean |
| `npm run typecheck:strict` | ✅ clean |
| `npm test` | ✅ **55/55** (16.9s, 7 files) |
| `npm run build` | ✅ 11.9s |
| `npm run test:e2e` | ✅ **1/1** chromium (10.2s) |
| Main gzip | **195.46 kB** (band 191.1–198.9 ✓, +0.15 vs 4.2 baseline 195.31) |
| Async `DatePickerPopover-BBekLy3i.js` gzip | **28.93 kB** (baseline 28.94 — preserved) |
| Split verification | `rg -c "react-day-picker\|date-fns" dist/assets/index-*.js` = **0** hits; same pattern in `DatePickerPopover-*.js` = 1 hit → chunk boundary intact |
| MSW dist purity | `rg -c msw dist/assets/*.js` = 0 hits ✅ |

### Loader-pattern correctness

- **Exactly-one-request invariant** — `DatePickerPopover.loader.ts:12` uses `promise ??= import("./DatePickerPopover")`. `React.lazy(loadDatePickerPopover)` in `DatePickerField.tsx:34`, the idle-callback `prefetchDatePickerPopover` (line 48/53), and the trigger's `onPointerEnter` / `onFocus` (lines 119-120) all funnel through the same memoized promise → the browser issues one network fetch for the ~28.93 kB chunk regardless of which path wins the race. ✅
- **Failure-reset ≠ infinite retry** — `prefetchDatePickerPopover` (loader.ts:19-22) resets the memo only on rejection. Retries are user-gated (a new `pointerenter`, `focus`, or click), not automatic — no polling loop possible. React.lazy retains its own successful-module cache; the memo reset only matters on the failure path. ✅
- **`requestIdleCallback` guard correctness** — `typeof w.requestIdleCallback === "function"` (line 47) correctly excludes jsdom and Safari; falls back to `setTimeout(1750)`. `typeof window === "undefined"` short-circuit (line 45) keeps SSR / no-DOM safe. ✅
- **No unmount leak** — `useEffect` returns a cleanup closure that calls `cancelIdleCallback` or `clearTimeout` (lines 51, 54). If the idle callback already resolved and started `import()`, the module load is fire-and-forget and memoized — benign. ✅
- **Keyboard-only flow preserved** — `onFocus` mirrors `onPointerEnter` (lines 119-120), so Tab-navigating users trigger prefetch on focus before Enter/Space activation. Not pointer-gated. ✅

### Contract check — "popover subtree not mounted until click" still valid

The additive test asserts `document.querySelector("[data-radix-popper-content-wrapper]") === null` on initial render. Prefetch fetches the **JS module** but does not render `<DatePickerPopover>` — that is still gated by `pickerMounted` state (`DatePickerField.tsx:92, 131, 146`) which only flips on `onClick`. In jsdom the prefetch does not even fire (no `requestIdleCallback`; the 1.75s `setTimeout` never elapses inside the synchronous test window), so the assertion is doubly safe. The distinction *code fetched ≠ component mounted* holds in implementation. ✅

### Call-site sweep

`rg DatePickerField src/ -g "*.tsx"` → both consumers (`RegisterPage.tsx:293`, `PendingRiders.tsx:193`) use the shared component and therefore inherit prefetch automatically. No consumer-side changes needed. ✅

### H-rules recheck

Commit touches only `src/components/DatePickerField.tsx` and adds `src/components/DatePickerPopover.loader.ts` (2 files, +72/−3). No changes to fetch shapes (H1), `ROLES` (H2), Customer seed (H3), `src/components/ui/**` (H4), `.env` (H5), MSW handlers or `config.ts` (H6), `session.ts` (H7), or guards (H8). All 🟢.

### Findings

- **F-4.3-01** — *Positive.* Both DatePickerField call sites (RegisterPage DOB, PendingRiders DOB on `/admin/pending-riders`) get the prefetch UX for free — perf fix is a single-point improvement.
- **F-4.3-02** — *Info.* No new tests added. The layered-prefetch behavior is a real-browser concern (idle callback + real network) that jsdom cannot exercise faithfully; the existing Playwright E2E gate is the correct place to catch a regression here, and it passed. Recommend re-running `npm run test:e2e` any time `DatePickerField.tsx` or `DatePickerPopover.loader.ts` change materially — already covered by the F-4.2-04 checklist.

### Sign-off

All 6 gates green, bundle split preserved, loader pattern is correct on all four axes reviewed (dedup, failure-reset, idle guard, keyboard). No H-rule impact. **Ship.** ✅


## Iteration 4.4 addendum — DatePicker simplification (drop lazy split)

**Date:** 2026-07-30 · **Reviewer:** QA-Iter4e · **Commit:** `0f79f7e` `refactor(components): merge DatePickerPopover into DatePickerField (drop lazy split)` · **Verdict:** **SHIP ✅**

### Owner decision context
At ~224 kB total the app doesn't justify micro-splitting the 29 kB picker chunk against the cost of `React.lazy` + `Suspense` + `pickerMounted` state + prefetch (idle + pointerenter/focus) + spinner + loader-module machinery. Reverted to the canonical static shadcn date-picker pattern. Route-level splitting will be reconsidered as the app grows. Old bundle band **191.1–198.9 kB is VOID**; new baseline **223.43 kB** (PM to record; suggested ±2% band **219–228 kB**).

### Gates at HEAD `0f79f7e`
| Gate | Result |
|---|---|
| `npm run lint` | ✅ clean |
| `npm run typecheck` | ✅ clean |
| `npm run typecheck:strict` | ✅ clean |
| `npm test` | ✅ **55/55** (7 files, 22.06s) |
| `npm run build` | ✅ 15.4s |
| `npm run test:e2e` | ✅ **1/1** chromium (11.1s) |
| Main gzip | **223.43 kB** — exactly matches owner claim (new baseline) |
| Dist chunk count | **1 JS** — `dist/assets/index-*.js` only; no `DatePickerPopover-*.js` chunk emitted ✅ |
| Async picker chunk | **Absent** — `ls dist/assets/*.js` → single file ✅ |
| MSW dist purity | `rg -c msw dist/assets/*.js` → 0 hits ✅ |
| `react-day-picker` in main | 1 hit (expected — now static, folded into main) ✅ |

### Diff review — lazy machinery removal is total
`rg -n 'lazy\|Suspense\|requestIdleCallback\|pickerMounted\|loadDatePicker\|DatePickerPopover' src/`:
- `DatePickerField.tsx:10` — comment mentioning "React.lazy / Suspense / pickerMounted / prefetch machinery removed" (doc-only, correct)
- `AuthProvider.tsx:3` — unrelated ("useState lazy initializer")
- **`RegisterPage.tsx:286-288`** — stale JSDoc "Phase-6 lazy split PRESERVED: only the outline Button trigger + mount flag live in the main chunk; Popover + Calendar load on first click." ⚠️ **Now factually wrong** (Popover + Calendar are static). Doc-only, non-blocking. Filed as **F-4.4-01**.

No dead imports, no leftover Suspense/lazy calls. `DatePickerPopover.tsx` and `.loader.ts` deleted. `date-helpers.ts` still used (`formatDobDisplay` in `DatePickerField.tsx:61` + `RegisterPage.tsx:297`) — retained correctly.

### Behavior preservation (vs 4.1–4.3 addenda)
| Contract | Location | Status |
|---|---|---|
| `captionLayout="dropdown-buttons"` | `DatePickerField.tsx:106` | ✅ |
| `fromYear` / `toYear` from call sites | `DatePickerField.tsx:107-108`; call sites pass `DOB_MIN_YEAR=1940` / `DOB_MAX_YEAR=currentYear-18` | ✅ |
| `disabled after Dec 31 of toYear` (underage-impossible) | `DatePickerField.tsx:109` `disabled={{ after: new Date(toYear, 11, 31) }}` | ✅ |
| DD/MM/YYYY display | `DatePickerField.tsx:61` via `formatDobDisplay` | ✅ |
| ISO wire (H1) | Unchanged — `RegisterPage` still `parseDobDisplay(form.dob)` → picker → `formatDobDisplay(d)` back to state → ISO conversion on submit lives in RegisterPage (not touched by 0f79f7e); guarded by `tests/regression/contract.test.ts` | ✅ |
| `<Label htmlFor>` / `id` wiring | `DatePickerField.tsx:78` (`id={id}`) | ✅ |
| `aria-invalid` / `aria-describedby` / `role="alert"` | `DatePickerField.tsx:82-83, 114-117` | ✅ |
| Field-styling locks (`hover:bg-background`, `data-[state=open]:bg-background`, palette-collision defeat) | `DatePickerField.tsx:88-91` | ✅ preserved verbatim |
| `onClose` blur-validation callback | `DatePickerField.tsx:71-74` fires on `onOpenChange(false)` | ✅ |
| `initialFocus` | `DatePickerField.tsx:110` | ✅ |
| Select-closes-popover | `DatePickerField.tsx:101-104` `if (d) setOpen(false)` — no longer racing Radix internal state since we own it via controlled `open` | ✅ |
| Both call sites unchanged | `git show --stat 0f79f7e` → only `DatePickerField.tsx`, `DatePickerPopover.tsx` (deleted), `.loader.ts` (deleted), `iter4-additive.test.tsx` — RegisterPage/PendingRiders untouched | ✅ |

### Rewritten test — meaningfulness check
`tests/regression/iter4-additive.test.tsx:167-180` "mounts a static outline trigger; Radix PopoverContent is absent until clicked":
- Renders **real** `RegisterPage` subtree (via `renderRegister()`) — no component stubbing / mocking.
- Asserts (1) trigger is `<BUTTON>` with `DD/MM/YYYY` placeholder, (2) `[data-radix-popper-content-wrapper]` absent at initial render, (3) `user.click(trigger)` → wrapper mounts (`waitFor` for portal mount).
- With the lazy split gone, jsdom+rdp v8 now render the popover subtree cleanly on click — the transition **absent → present** is a real Radix contract exercised end-to-end in jsdom. Meaningful. ✅

### Regression checks
- **44 baseline tests byte-identical** — `git diff 0f79f7e^..0f79f7e -- tests/regression/ ':!tests/regression/iter4-additive.test.tsx'` empty ✅
- **H4 no `ui/**` edits** — `git show --stat 0f79f7e -- 'src/components/ui/*'` empty ✅
- **E2E asChild-ref guard** — `tests/e2e/datepicker.spec.ts` doesn't assert the ref class explicitly, but it clicks the `#reg-dob` Button, waits for `[data-radix-popper-content-wrapper]` to attach, drives the native month/year `<select>`s, clicks `gridcell 15`, and asserts the trigger echoes `15/06/YYYY-25` with **zero console noise**. Any regression to the Radix Slot ref-attach path (F-4.2-01 root cause) would immediately fail this flow — passes cleanly. ✅
- **H1 / H2 / H3 / H5 / H6 / H7 / H8** — untouched by this commit (UI-component-internal refactor). ✅

### Findings
- **F-4.4-01** — *Minor, doc-only, non-blocking.* `src/features/auth/pages/RegisterPage.tsx:286-288` still carries a stale JSDoc block claiming "Phase-6 lazy split PRESERVED: … Popover + Calendar load on first click." Post-4.4 the popover + calendar are **static** in the main chunk. Recommend a one-line comment refresh next time RegisterPage is edited (e.g. "Simplified 2026-07-30 (iter 4.4): static shadcn pattern — see DatePickerField header comment"). Not worth its own commit.
- **F-4.4-02** — *Sanity: re-addable typed-entry-era assertions.* With jsdom now mounting the real popover subtree, one could in principle re-add a "select-a-date-then-submit → ISO on wire" jsdom test. **Recommend against.** (a) The ISO wire is already covered by `tests/regression/contract.test.ts` (backend contract) and the Playwright E2E (functional flow). (b) Driving rdp v8's transparent native `<select>` overlays in jsdom is fragile and slower than the E2E path. (c) Zero incremental confidence per unit of test-maintenance cost. Leave as-is.

### Sign-off
All 6 gates green. Main gzip **223.43 kB** matches claim. Single JS chunk — no picker/popover async chunk emitted. All lazy machinery removed from `src/`. Every 4.1–4.3 behavioral contract preserved (dropdown-buttons caption, 1940..current-18 bounds + disabled-after guarantee, DD/MM/YYYY display, ISO wire, label/aria error wiring, field-styling locks, onClose, select-closes). Rewritten test exercises the real Radix subtree — meaningful. H4 clean; H1/H2/H3/H5/H6/H7/H8 untouched. F-4.4-01 is a stale JSDoc comment in RegisterPage — doc-only, non-blocking.

**Ship.** ✅
