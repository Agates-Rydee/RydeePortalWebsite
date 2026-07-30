# Restyle Audit — Current-State UI Inventory (D8)

> **Scope**: everything under `src/features/**/*.tsx` + `src/components/shared*.{tsx,ts}` — the hand-rolled UI layer that will migrate to `src/components/ui/` (shadcn). Zero source changes in this doc; observations only.
> **Assumption (per task brief, user may veto)**: preserve the Rydee green visual identity — this is systematization, not a rebrand.
> **Related**: `docs/ux/restyle-spec.md` (implementation spec, phasing).

---

## 1. Pattern inventory

### 1.1 Buttons

| Pattern | Where | How it's built | Issues |
|---|---|---|---|
| **Primary CTA** ("Sign in", "Create account", "Generate PIN") | `LoginPage.tsx:107-113`, `RegisterPage.tsx:147-155`, `PendingRiders.tsx:239-247` | `<button>` + `style={btnPrimary}` (linear-gradient `#17a882→#0d8f6e`, box-shadow), plus `onMouseEnter`/`onMouseLeave` JS mutating `boxShadow` + `transform: translateY(-1px)` | Hover state is JS, not CSS — no keyboard-`:hover`-parity, no `:focus-visible` ring, `transform` jump ignores `prefers-reduced-motion`. Two duplicated hover handlers (Login + Register + PendingRiders). Loading state swaps to `btnLoading` object (opacity gradient) — non-standard disabled semantics. |
| **Primary loading** | same | `style={loading ? btnLoading : btnPrimary}`, inline `<Spinner />` | No `aria-busy`; visual only. Spinner is a hand-rolled SVG (`shared.tsx:33-40`). |
| **Secondary / muted** ("Save changes", header "Sign out") | `PendingRiders.tsx:249-257`, all three dashboards' `Sign out` | `bg: var(--muted)`, JS hover swaps to `var(--secondary)` | JS hover; no focus ring. |
| **Destructive** ("Block rider") | `PendingRiders.tsx:259-267` | `bg: rgba(239,68,68,0.10)`, `color: #ef4444`, JS hover darkens | JS hover; `window.confirm()` used for confirmation (not accessible / not stylable — see 1.9). |
| **Ghost / link** ("Forgot password?", "Register", "Sign in" text-links) | `LoginPage.tsx:117-121, 125-129`, `RegisterPage.tsx:161-165` | Bare `<button>` styled as anchor, JS hover swaps color | No `:focus-visible` ring; keyboard users get no hover-equivalent feedback. |
| **Icon button** (password eye toggle) | `LoginPage.tsx:98-102`, `RegisterPage.tsx:118-122, 136-140` | `<button tabIndex={-1}>` — **removed from tab order**. Deliberate but means SR users cannot toggle password visibility via keyboard. | `tabIndex={-1}` is an a11y trap for keyboard/AT users. Should be reachable with `aria-pressed` + `aria-label`. |
| **Back button** | `shared.tsx:78-90` + inline in `RegisterPage.tsx:75-82` | JS hover, arrow SVG | Duplicated (one shared `<BackButton>`, one inline in Register). |
| **Card-as-button** ("Register new user" tile on Admin) | `AdminDashboard.tsx:135-160` | `<button>` wrapping a card, JS hover boosts box-shadow | Focus ring not designed. |
| **Big-number link** (Active/Pending count is a button) | `AdminDashboard.tsx:181-189, 204-212`, `OperatorDashboard.tsx:144-152, 167-175` | 36px bold `<button>`; JS hover swaps color + `text-decoration: underline` | Screen readers announce as button, but the surrounding "Tap to view live map →" hint is a separate `<p>` — no `aria-describedby` linking them. |

### 1.2 Inputs & form controls

| Pattern | Where | How it's built | Issues |
|---|---|---|---|
| **Text/tel/email/date input** | `shared.tsx:42-76` (`<FieldInput>`) — used by Login, Register; inlined in `PendingRiders.tsx:138-148, 171-188` | `<input>` + `style={inputBase}`, `onFocus`/`onBlur` JS mutating border + box-shadow to a green ring | JS focus ring can be lost on re-render; `outline: none` with no `:focus-visible` fallback means keyboard users lose the ring if JS handlers detach. `caretColor` set on inputBase but nowhere else. Labels use `color: "#2d5045"` — hardcoded hex, not a token. |
| **Password + eye toggle** | Login + Register | `<FieldInput>` with `children` slot for toggle button | Toggle button `tabIndex={-1}` (see 1.1). No `aria-pressed`. |
| **Confirm password (bespoke)** | `RegisterPage.tsx:126-143` | Copy-paste of `<FieldInput>` markup (not reused) to allow error-border on mismatch | Duplicated ~15 lines of input JSX; error border is a hex string (`#ef4444`), not `--destructive`. `aria-invalid` missing. Error message not linked via `aria-describedby`. |
| **Read-only display input** ("Age (calculated)", "Access PIN") | `PendingRiders.tsx:175-179, 227-235` | `<input readOnly>` with opacity 0.65 | Not an input semantically — should be a definition/text element. Currently focusable + tab-stop. |
| **Select** (role dropdown, area dropdown, pending-rider picker) | `RegisterPage.tsx:100-111`, `PendingRiders.tsx:99-119, 152-166` | Native `<select>` + inline SVG background chevron + `appearance: none` + JS focus | Native select is a11y-friendly but the styling is duplicated 3× byte-for-byte. Placeholder color logic (`form.role ? var(--card-foreground) : #5a8070`) inline. |
| **Checkbox** (verification documents) | `PendingRiders.tsx:191-224` | **Custom div-as-checkbox**: `<label>` wraps a `<span onClick>` — not an `<input type="checkbox">` at all | **A11y major**: not keyboard-operable, not announced as a checkbox by SR, not part of any form control. `onClick` on a `<span>` inside a `<label>` has questionable behavior. |

### 1.3 Cards / surfaces

| Pattern | Where | Issues |
|---|---|---|
| `cardStyle` (`shared-styles.ts:7-11`) | All auth pages, dashboards, pending-rider form | White bg + green-tinted 1px border + double box-shadow. Consistent — good. |
| Empty-state card (PendingRiders, no rider selected) | `PendingRiders.tsx:272-282` | Uses `{...cardStyle, boxShadow: "none"}` override — one-off shape. |
| Stat card (Total/Active/Pending count) | Admin + Operator dashboards | Duplicated ~35 lines each between Admin and Operator. |
| Auth card wrapper | `AuthShell.tsx` + `LoginPage:88`, `RegisterPage:73` — every auth page wraps `<div className="w-full rounded-2xl p-8" style={cardStyle}>` | Duplicated card wrapper; could be an `<AuthCard>` primitive. |

### 1.4 Tables

| Pattern | Where | Issues |
|---|---|---|
| Rider profile table | `RiderDashboard.tsx:75-188` | Native `<table>` with 10 `<tr>`; **no `<thead>`, no `<caption>`, no `<th scope="row">`**. Uses `<td>` for both label and value → SR announces "column 1, column 2" instead of "Name: Danial". A11y major. |
| Table typo | `RiderDashboard.tsx:78, 88, ...` | `font-small` — not a valid Tailwind class. Silently ignored. |
| Right-side map hardcoded width | `RiderDashboard.tsx:192` | `w-[850px] h-[600px]` — breaks on any viewport <850px. |

### 1.5 Badges / pills

| Pattern | Where | Notes |
|---|---|---|
| Role badge ("Admin", "Operator") | `AdminDashboard.tsx:100-105`, `OperatorDashboard.tsx:91-96` | Green-tint pill; hex + rgba both hardcoded. |
| Pending-count badge ("8 pending") | `PendingRiders.tsx:82-85` | Amber-tint pill (rgba(245,158,11,0.12)). |
| Live badge ("Live — updates every 3s") | `ActiveRiders.tsx:67-74` | Green tint + pinging dot. |
| State pill (Dispatching/Arriving/Idle) | `ActiveRiders.tsx:79-89` | Rendered inside a `.map()` — computed border/color from `STATE_COLOR` hex map (`#22c55e`, `#eab308`, `#ef4444`). Duplicated inline in Leaflet Popup (`ActiveRiders.tsx:121-132`) with a slightly different rendering. |
| "✓ Saved" toast-like pill | `PendingRiders.tsx:128-133` | Not a toast — inline, 2-second `setTimeout` clears. Uses raw green-tint. |
| "Received" mini-pill on doc checkbox | `PendingRiders.tsx:216-219` | Green tint. |

### 1.6 Spinner / loading

| Pattern | Where | Notes |
|---|---|---|
| `<Spinner>` (SVG dashes rotating) | `shared.tsx:33-40`, used in Login + Register submit buttons | Fine visually but no `role="status"` / `aria-label`. |
| "Loading map…" text | `RiderDashboard.tsx:26`, `RiderLocationView.tsx:38` | Bare `<div>Loading map…</div>` — no styling, no spinner, no `role="status"`. |
| "—" fallback in stat cards | Admin/Operator | Sentinel value used while `pendingCount === null`. No skeleton. |

### 1.7 Navigation / header

| Pattern | Where | Notes |
|---|---|---|
| Dashboard top-nav | Admin, Operator, Rider dashboards | Duplicated 3× byte-for-byte (Logo left + role badge + name + Sign out). |
| "Back" chrome for sub-pages | `ActiveRiders.tsx:58-65`, `PendingRiders.tsx:74-86` | Uses shared `<BackButton>`. |
| Sticky positioning | Admin/Operator/Rider only (`sticky top-0 z-10`) | ActiveRiders header is `z-[1000] relative` because Leaflet uses z-index 400+ for tiles — leaks Leaflet impl detail into layout code. |

### 1.8 Background chrome

| Pattern | Where | Notes |
|---|---|---|
| `<Bg />` gradient/grid overlay | `shared.tsx:7-20` | Only used on auth pages via `AuthShell`. Not present on dashboards → intentional visual differentiation, but the auth-shell footer text ("Rydee · Karachi, Pakistan · Electric mobility for everyone") is `#5a8070` at `text-xs` — **contrast borderline** (see §2). |

### 1.9 Confirmations & dialogs

- **`window.confirm()`** used for "Block rider" (`PendingRiders.tsx:54`). Native browser prompt — not stylable, breaks the visual identity, and is announced with generic wording. Replace with `AlertDialog`.

### 1.10 Selects with placeholder-styling hack

The chevron SVG data-URL + `background-image` + `appearance: none` pattern is duplicated in **three** places (`RegisterPage.tsx:100-111`, `PendingRiders.tsx:99-119`, `PendingRiders.tsx:152-166`). All three use the same hardcoded `stroke='%235a8070'`.

---

## 2. Accessibility findings (WCAG 2.1 AA against current theme)

### 2.1 Contrast

Colors are measured against their actual rendered backgrounds. Ratios are approximate (measured at hex intersection).

| Foreground | Background | Ratio | AA (normal / large) | Where |
|---|---|---|---|---|
| `#17a882` (primary) | `#ffffff` (card) | **~2.85 : 1** | ❌ normal · ⚠️ large (≥18pt/24px bold) borderline | "Register new user" 18px semibold link (`AdminDashboard:146`); "Sign in / Register" text-links (12-14px) **FAIL** as normal text. Numeric counts (36px bold) pass as large. |
| `#0d8f6e` (primary hover) | `#ffffff` | ~4.05 : 1 | ✅ normal (barely) | Hover-only — not readable in default state. |
| `#ffffff` | `#17a882` (primary btn) | ~2.85 : 1 | ❌ normal | **All primary buttons — "Sign in", "Create account", "Generate PIN"** fail AA on the lighter gradient stop. Only passes at the `#0d8f6e` end. |
| `#ffffff` | `#0d8f6e` | ~4.05 : 1 | ✅ normal | Right end of gradient only. |
| `#5a8070` (muted-fg) | `#f0faf7` (background) | ~4.02 : 1 | ⚠️ borderline (needs ≥4.5) | Body text throughout ("Welcome back. Enter…", "Choose a rider…", tap-hints, auth-shell footer). **FAIL** for normal text. |
| `#5a8070` | `#ffffff` (card) | ~4.35 : 1 | ⚠️ borderline | Muted labels on cards; still fails 4.5:1 by a hair. |
| `#2d5045` (label) | `#f0faf7` | ~9.5 : 1 | ✅ | Field labels — good. |
| `#f59e0b` (amber, pending) | `#ffffff` | ~2.15 : 1 | ❌ normal · ✅ large (36px bold) | Pending count 36px passes as "large" (≥3:1). The amber "tap to review applications →" hint at `text-xs` **FAILS**. |
| `#ef4444` (destructive) | `#ffffff` | ~3.75 : 1 | ❌ normal · ✅ large | Error text ("Passwords do not match", form error) at `text-sm` **FAILS**. |
| `#22c55e` state color | `#ffffff` | ~2.5 : 1 | ❌ | Live badge text + state pills (Dispatching). Fails at 12-14px. |
| `#eab308` state color | `#ffffff` | ~1.85 : 1 | ❌ | Arriving pill. Fails badly. |

**Summary**: the brand green `#17a882` is a "graphic AA" color, not a text AA color. Every primary CTA and every green text link **currently fails WCAG AA 4.5:1 for normal text**. This is the biggest single a11y gap. Recommendation in `restyle-spec.md` §1.

### 2.2 Focus

- `outline: none` set on every input (`shared.tsx:62`) with a JS-driven substitute ring — no `:focus-visible` fallback. If the `onFocus` handler doesn't fire (mount race, re-render), keyboard users get **no focus indicator at all**. WCAG 2.4.7 fail.
- Every hand-rolled button (Sign out, Sign in, text-links, big-number links, card-as-button) has **no designed focus state**. Browser default outline is not suppressed on `<button>`, but it's browser-dependent and often invisible against the green.
- Password-toggle button uses `tabIndex={-1}` — keyboard users cannot reveal the password. WCAG 2.1.1 fail.

### 2.3 Labels & form semantics

- `<FieldInput>` correctly pairs `<label htmlFor>` and `<input id>` — good.
- Confirm-password error text (`RegisterPage:142`) is a sibling `<p>`, not linked via `aria-describedby`. `aria-invalid` missing on the input.
- Form-level error (`Login:105`, `Register:145`) is a bare `<p>` — not `role="alert"`, not linked to any control.
- Verification-document "checkboxes" are `<span onClick>` — no `role="checkbox"`, no `aria-checked`, not keyboard-operable. **WCAG 2.1.1 + 4.1.2 fail.**

### 2.4 Tables

- `RiderDashboard` profile table has no `<th>`, no `<caption>`. Row headers should be `<th scope="row">`. Currently SR announces "table, 10 rows, 2 columns, Name, Danial, Address, …" with no row-header semantic — usable but suboptimal. WCAG 1.3.1.

### 2.5 Keyboard traps / order

- No traps found, but `tabIndex={-1}` on password toggle removes a critical control from keyboard reach.
- `window.confirm()` on Block rider is keyboard-friendly (browser handles it) but breaks the styled experience.

### 2.6 Motion

- `translateY(-1px)` on primary-button hover ignores `prefers-reduced-motion`.
- Pinging dots (Active Riders live badge, Admin dashboard active count) use `animate-ping` — reasonable, but no reduced-motion opt-out designed.

### 2.7 Zoom / responsive

- `RiderDashboard.tsx:192` hardcodes `w-[850px]` for the map panel — overflows on any laptop <850px CSS px wide. WCAG 1.4.10 concern.
- Grid `grid-cols-[40%_60%]` on the same page doesn't collapse to single column on mobile (only `md:` breakpoint; below `md` it stays 40/60).
- Admin/Operator dashboards use `max-w-2xl` — narrow (672px) but centered; responsive OK.

---

## 3. Duplication hotspots (systematization targets)

| Duplicated pattern | Instances | Consolidation target |
|---|---|---|
| Primary button + JS hover | 3 (Login, Register, PendingRiders generate-PIN) | `<Button variant="default">` (shadcn) with brand palette |
| Ghost / text-link button | 4 (Forgot password, Register, Sign in, back-arrow-only) | `<Button variant="link">` or `<Button variant="ghost" size="sm">` |
| Sign-out button | 3 (Admin, Operator, Rider dashboards) | `<Button variant="secondary" size="sm">` in a shared `<DashboardHeader>` |
| Dashboard top-nav (Logo + role-badge + name + Sign out) | 3 | Extract `<DashboardHeader role={} name={} onSignOut={}>` |
| Stat-card (uppercase label + huge number + icon square) | 6 (3 on Admin, 3 on Operator) | `<StatCard label icon value href?>` on top of `<Card>` |
| Native select + chevron background-image + focus JS | 3 | `<Select>` (shadcn — Radix) |
| Green-tint pill / role badge / count badge | 5+ | `<Badge variant="brand" \| "warning" \| "destructive" \| "state-dispatching">` |
| Card wrapper (rounded-2xl + cardStyle) | ~12 | Shadcn `<Card>` with a `.card-elevated` class for the double-shadow |
| Form-error text (`text-sm color:#ef4444`) | 3 | `<FormMessage>` from shadcn Form |

---

## 4. Test-visible surface (what the 44-test suite asserts)

From `tests/regression/*.tsx`:

| Selector / assertion | Source | Immutable? |
|---|---|---|
| `getByLabelText(/phone number/i)` | LoginPage `<label>Phone Number</label>` | **Label text must contain "phone number"** (case-insensitive). |
| `getByLabelText(/^password$/i)` | LoginPage `<label>Password</label>` | **Exactly "Password"** (no "confirm", no "new"). Confirm-password label is `Confirm password` — safe. |
| `getByRole("button", { name: /sign in/i })` | LoginPage submit button | **Button accessible name must contain "sign in"**. Loading state text "Signing in…" also matches (still contains "sign in"). |
| `findByText(/invalid phone or password/i)` | Rendered from `error` state — comes from MSW 401 body | **Page must render the fetch error text as visible text.** |
| `findByText(/valid phone number/i)` | LoginPage client-side error `"Please enter a valid phone number."` | **Page must render that literal string (or one containing "valid phone number").** |
| `getByLabelText(/role/i)` (roles.test.tsx) | RegisterPage admin variant `<label>Role</label>` | **Role select must have a label containing "role"**. |
| `findByTestId("rider-home" / "admin-home" / "operator-home")` | **Test-suite-owned stubs** (`login-flow.test.tsx:24-26`) — NOT in production code | Not a page-code constraint. |
| `findByTestId("login-page" / "rider-page" / etc.)` | **Guard suite stubs** (`guards.test.tsx:19-28`) — NOT in production code | Not a page-code constraint. |

**Conclusion**: the tests bind us to five actual text/role facts in the auth pages: (1) `Phone Number` label, (2) `Password` label, (3) accessible name `Sign in` on the submit button, (4) surfacing the server error string, (5) surfacing a "valid phone number" client-side error, plus (6) a `Role` label on `/admin/register`. Everything else — dashboards, riders, styling, hover behavior, badges, cards — is **not** test-covered and can change freely as long as fetch calls, routes, guards and session storage stay intact (H1, H6, H7, H8).

---

## 5. Design tokens already declared vs actually used

Declared in `src/styles/theme.css` (`:root`): `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover(-foreground)`, `--primary(-foreground)`, `--secondary(-foreground)`, `--muted(-foreground)`, `--accent(-foreground)`, `--destructive(-foreground)`, `--border`, `--input`, `--input-background`, `--switch-background`, `--ring`, `--radius`, `--sidebar-*`, `--chart-1..5`.

Also declared as Tailwind theme aliases in `@theme inline`: `--color-primary`, etc. → so `bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring` all work.

**But hand-rolled code hardcodes hex constantly:**
- `#17a882` — appears in **28 places** across source files where `var(--primary)` would work.
- `#0d8f6e` — hover-darker of primary; **not a token**, hardcoded 6× (gradient stop, hover handler). Should become `--primary-hover` or a shade in a scale.
- `#2d5045` — label green; hardcoded 8×; **not a token**. Should become `--label` or `--foreground-strong`.
- `#5a8070` — muted-fg fallback; hardcoded 9× including in the `<option>` placeholder styling and the auth-shell footer. Matches `--muted-foreground` (`#5a8070`) — trivial to replace.
- `#f59e0b` / `#d97706` — amber pending; hardcoded 7×; **not a token**. Should be `--warning` + `--warning-foreground` (or use shadcn's palette).
- `#22c55e` / `#eab308` / `#ef4444` — rider-state colors; hardcoded 4× each in `ActiveRiders.tsx`. Should be `--state-dispatching`, `--state-arriving`, `--state-idle`.
- `rgba(23,168,130, XX)` — the primary color at various alphas (0.06, 0.10, 0.12, 0.15, 0.16, 0.20, 0.25, 0.30, 0.45, 0.60) — 20+ occurrences. Should be a small scale (`primary/10`, `primary/20`, `primary/30`, `primary/50`).

The theme file is a strong starting point; the audit surfaces that the missing tokens are **hover-shade, label-green, warning-amber, state colors, and primary-alpha steps**. Spec proposes these additions in §1.
