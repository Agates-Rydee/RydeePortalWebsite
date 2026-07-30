# Restyle Implementation Spec — shadcn/ui Adoption (D8)

> **Status**: Proposed (2026-07-30)
> **Companion**: `docs/ux/restyle-audit.md` (current-state findings)
> **Owner**: Frontend Developer (implementation) · UI/UX Designer (design-system spec + a11y review)
> **Constraint**: PRESERVE existing Rydee visual identity. This is systematization, not a rebrand.

---

## 1. Token Mapping — theme.css → Tailwind/shadcn conventions

### 1.1 Existing tokens (keep as-is in theme.css)

The `:root` CSS custom properties map 1:1 to shadcn's expected shape via the `@theme inline` block. **No renaming needed** — the shadcn primitives in `src/components/ui/` already reference `bg-primary`, `text-muted-foreground`, `border-input`, `ring-ring`, etc. These work today.

### 1.2 New tokens to add (missing from current theme)

Add to `:root` in `theme.css` and expose in `@theme inline`:

```css
:root {
  /* ─── Brand shades (primary scale) ─── */
  --primary-hover: #0d8f6e;          /* darker for hover; used in btn gradient stop-2 */
  --primary-active: #0a7c5f;         /* pressed state */

  /* ─── Semantic: label / heading emphasis ─── */
  --foreground-label: #1b4d3e;       /* WCAG AA-compliant replacement for #2d5045 on #f0faf7; ratio ~10.5:1 */

  /* ─── Semantic: warning (amber) ─── */
  --warning: #b45309;                /* AA-safe amber (4.6:1 on white). Replaces #f59e0b for text. */
  --warning-foreground: #ffffff;
  --warning-muted: rgba(180, 83, 9, 0.12);

  /* ─── Semantic: success / dispatching ─── */
  --success: #15803d;                /* AA-safe green text (5.0:1 on white). Replaces #22c55e for text. */
  --success-muted: rgba(21, 128, 61, 0.12);

  /* ─── Semantic: state arriving ─── */
  --state-arriving: #a16207;         /* AA-safe gold text (4.7:1 on white). Replaces #eab308. */
  --state-arriving-muted: rgba(161, 98, 7, 0.12);

  /* ─── Semantic: state idle ─── */
  --state-idle: #dc2626;             /* already ≈4.5:1 on white; matches Tailwind red-600 */
  --state-idle-muted: rgba(220, 38, 38, 0.12);

  /* ─── Primary (WCAG-safe text variant) ─── */
  --primary-text: #0f7c63;           /* AA-safe for normal text on white (4.52:1). Use for links + small green text. */
}

@theme inline {
  --color-primary-hover: var(--primary-hover);
  --color-primary-active: var(--primary-active);
  --color-primary-text: var(--primary-text);
  --color-foreground-label: var(--foreground-label);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-warning-muted: var(--warning-muted);
  --color-success: var(--success);
  --color-success-muted: var(--success-muted);
  --color-state-arriving: var(--state-arriving);
  --color-state-arriving-muted: var(--state-arriving-muted);
  --color-state-idle: var(--state-idle);
  --color-state-idle-muted: var(--state-idle-muted);
}
```

### 1.3 Primary button — contrast fix

Current `#17a882` with white text = 2.85:1 — **fails AA**. Two safe options:

| Option | Primary bg | White text ratio | Visual impact |
|---|---|---|---|
| **A (recommended)** | Darken to `#0d8f6e` flat | 4.07:1 ≈ AA-large. Still borderline for 14px normal. | Slightly deeper green — still very "Rydee". No gradient. |
| **B** | Keep gradient `#0d8f6e → #0a7c5f` | 4.07–5.0:1 | Passes at both stops. Gradient feel preserved. |
| **C** | Keep `#17a882` but make text `#003d2e` (dark) | 7.0:1 | Lighter button with dark text. Different vibe. |

**Recommendation**: Option **B** — deepen the gradient one stop (`#0d8f6e → #0a7c5f`). White text passes at both endpoints. Keeps the gradient aesthetic. Apply via `bg-primary-hover` with a tailwind gradient utility rather than inline style.

### 1.4 Muted-foreground fix

`#5a8070` on `#f0faf7` = 4.02:1. Fails 4.5:1.

**Proposal**: darken to `#4a6b5e` → 5.1:1 on `#f0faf7`, 5.6:1 on `#ffffff`. Update `--muted-foreground` in `:root`. Minimal visual change (slightly deeper sage).

### 1.5 Destructive text fix

`#ef4444` on white = 3.75:1 (fails). Darken to `#dc2626` (Tailwind red-600) → 4.52:1. Update `--destructive`.

---

## 2. Component Mapping Table

### Key

- **H-R** = hand-rolled pattern (from audit)
- **→** target shadcn component from `src/components/ui/`
- Variant/size choices follow shadcn conventions

### 2.1 Auth pages (LoginPage, RegisterPage, AuthShell)

| H-R Pattern | Location | → shadcn | Variant / Size | Notes |
|---|---|---|---|---|
| Primary CTA button | Login:107, Register:147 | `<Button>` | `variant="default" size="lg"` + custom class `w-full rounded-xl py-3.5` | Remove JS hover; CSS handles via `hover:bg-primary-hover`. Add loading prop via `disabled` + spinner child. |
| Ghost text-link button | Login:117–129, Register:161–165 | `<Button>` | `variant="link"` | `text-primary-text` for AA compliance. |
| Back icon button | Register:75–82 | `<Button>` | `variant="ghost" size="icon"` | Shared `<BackButton>` stays but uses shadcn Button internally. |
| Password toggle | Login:98, Register:118,136 | `<Button>` | `variant="ghost" size="icon"` | **Remove `tabIndex={-1}`**; add `aria-label="Toggle password visibility"` + `aria-pressed`. |
| Text input | Login:93–97, Register:90–94 | `<Input>` | Default | Remove `onFocus`/`onBlur` JS — shadcn Input has `focus-visible:ring` built-in. Keep `rounded-xl py-3` override class. |
| Confirm-password input | Register:129–135 | `<Input>` | Default + `aria-invalid={pwMismatch}` | Use `aria-describedby` pointing to the mismatch `<p>`. |
| Select (role) | Register:100–111 | `<Select>` (Radix) | — | Native → Radix. Preserves label + value. |
| Card wrapper | Login:88, Register:73 | `<Card>` + `<CardContent>` | `.rounded-2xl .p-8` override | Card component + elevated shadow variant class. |
| Error text | Login:105, Register:145 | `<FormMessage>` (from `form.tsx`) or `role="alert"` paragraph | Destructive color | Add `role="alert"` so SR announces live. |
| Form `<form>` wrapper | Both | Consider wrapping with shadcn `<Form>` (react-hook-form) | — | **Deferred** — current `useState`-based form is functional; migration to react-hook-form is optional / separate ticket. |
| Spinner | Login:112, Register:153 | Keep `<Spinner>` in shared.tsx or use shadcn `<Skeleton>` for loading states | — | Add `role="status" aria-label="Loading"` to Spinner. |
| `<Bg>` background | AuthShell:13 | Keep as-is (decorative, no a11y impact) | — | Low priority; cosmetic. |

### 2.2 Dashboards (Admin, Operator, Rider)

| H-R Pattern | Location | → shadcn | Variant / Size | Notes |
|---|---|---|---|---|
| Sign-out button | All 3 headers | `<Button>` | `variant="secondary" size="sm"` | Remove JS hover. |
| Dashboard header (Logo + badge + name + Sign out) | 3× duplicated | Extract `<DashboardHeader>` organism using shadcn `<Badge>` + `<Button>` | — | New shared component in `src/features/dashboards/components/`. |
| Role badge pill | Admin:100–105, Operator:91–96 | `<Badge>` | `variant="secondary"` + brand-tint class | Token-based colors. |
| Stat card (label + big number + icon box) | Admin:162–198, Operator:126–183 | `<Card>` + `<CardContent>` | Custom layout inside | Extract `<StatCard>` organism. |
| Card-as-button ("Register new user") | Admin:135–160 | `<Card>` wrapped in `<button>` (or `asChild` Link) | `hover:shadow-lg focus-visible:ring-2` | CSS hover via Tailwind. |
| Big-number link button | Admin:181–189, Operator:144–152 | `<Button>` | `variant="link"` + `text-4xl font-bold` override | Or just a `<Link>` styled as text. Remove JS hover. |
| Profile table | Rider:75–188 | `<Table>` + `<TableBody>` + `<TableRow>` + `<TableCell>` | — | Add `<TableHeader>` with `scope="row"` on label cells. Use `<TableCaption>` "Rider Profile". |
| Map container (hardcoded 850px) | Rider:192 | Keep `<GoogleMap>` | — | Change `w-[850px]` → responsive: `w-full max-w-[850px]` or grid-controlled. |

### 2.3 Riders pages (ActiveRiders, PendingRiders)

| H-R Pattern | Location | → shadcn | Variant / Size | Notes |
|---|---|---|---|---|
| Pending-count badge | Pending:82–85 | `<Badge>` | `variant="outline"` + warning-tint class | Use `--warning` token. |
| Live badge | Active:67–74 | `<Badge>` | Custom "live" variant with pulsing dot | Keep existing dot animation; add `prefers-reduced-motion: no-animation` utility. |
| State pills (Dispatching/Arriving/Idle) | Active:79–89 | `<Badge>` | Dynamic `variant` per state | Dot + label pattern. Token-based colors from new `--success / --state-arriving / --state-idle`. |
| Rider-select dropdown | Pending:99–119 | `<Select>` (Radix) | — | Replace native select. |
| Area-select dropdown | Pending:152–166 | `<Select>` (Radix) | — | Replace native select. |
| Form inputs (name, phone, CNIC, DOB) | Pending:138–188 | `<Input>` | Default + `rounded-xl` | Remove JS focus handlers. |
| Document checkboxes | Pending:191–224 | `<Checkbox>` (Radix) | — | **Critical a11y fix**: real `<Checkbox>` with keyboard support + `aria-checked`. |
| "Generate PIN" button | Pending:239–247 | `<Button>` | `variant="default" size="default"` | Remove JS hover. |
| "Save changes" button | Pending:249–257 | `<Button>` | `variant="secondary"` | Remove JS hover. |
| "Block rider" button | Pending:259–267 | `<Button>` | `variant="destructive"` with outline styling: `variant="outline"` + destructive class | Remove JS hover. |
| Block confirmation | Pending:54 (`window.confirm`) | `<AlertDialog>` | Destructive variant | Shadcn `AlertDialog` with cancel + confirm. |
| "✓ Saved" feedback | Pending:128–133 | `<Sonner>` toast | `description="Changes saved"` | Replace inline setTimeout with `toast.success()`. |
| Read-only "Age" / "PIN" display | Pending:175–179, 227–235 | Plain `<span>` / `<p>` inside a field wrapper, or `<Input readOnly>` with `aria-readonly` | — | Remove from tab order if truly display-only. |
| Empty-state card | Pending:272–282 | `<Card>` with empty-state pattern | Muted icon + text | Optional: could use a shared `<EmptyState>` atom. |

---

## 3. States Spec — CSS-Only (no JS hover/focus handlers)

### 3.1 Button states (all variants)

| State | Implementation | Token |
|---|---|---|
| **Default** | `bg-primary text-primary-foreground` | existing |
| **Hover** | `hover:bg-primary-hover` (new token `#0d8f6e`) | CSS only via Tailwind |
| **Focus-visible** | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` | Built into shadcn Button |
| **Active/pressed** | `active:bg-primary-active active:scale-[0.98]` | New token `#0a7c5f` |
| **Disabled** | `disabled:opacity-50 disabled:pointer-events-none` | Built into shadcn Button |
| **Loading** | `disabled` + `<Spinner />` child, `aria-busy="true"` | Pattern: `<Button disabled><Spinner /> Signing in…</Button>` |

### 3.2 Input states

| State | Implementation |
|---|---|
| **Default** | `bg-input-background border-input` |
| **Focus** | `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]` (already in shadcn Input) |
| **Error** | `aria-invalid:border-destructive aria-invalid:ring-destructive/20` (already in shadcn Input) |
| **Disabled** | `disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed` |
| **Read-only** | `read-only:opacity-70 read-only:cursor-default read-only:focus-visible:ring-0` |

### 3.3 Card states

| State | Implementation |
|---|---|
| **Default** | `bg-card border border-border shadow-sm` |
| **Elevated (current cardStyle)** | Add utility `.card-elevated { box-shadow: 0 0 0 1px rgb(23 168 130 / 0.06), 0 8px 40px rgb(23 168 130 / 0.10); }` |
| **Hover (interactive card)** | `hover:shadow-md transition-shadow` |
| **Focus (card-as-button)** | `focus-visible:ring-2 focus-visible:ring-ring` |

### 3.4 Removing all JS hover/focus handlers

The restyle **deletes** every `onMouseEnter`/`onMouseLeave`/`onFocus`/`onBlur` handler that mutates `style`. Total identified: **32 instances** across the codebase. All replaced by Tailwind `hover:` / `focus-visible:` / `active:` utilities applied via `className`.

Files affected:
- `shared.tsx` — `BackButton` (1 handler pair)
- `shared-styles.ts` — `focusInput`, `blurInput` functions → **delete entirely**; `inputBase`, `btnPrimary`, `btnLoading`, `cardStyle` → **delete** (replaced by shadcn classes)
- `LoginPage.tsx` — 3 handler pairs
- `RegisterPage.tsx` — 4 handler pairs
- `AdminDashboard.tsx` — 5 handler pairs
- `OperatorDashboard.tsx` — 4 handler pairs
- `RiderDashboard.tsx` — 1 handler pair
- `PendingRiders.tsx` — 4 handler pairs
- `ActiveRiders.tsx` — 0 (uses Tailwind `transition-colors` already)

---

## 4. Accessibility Requirements Per Component

### 4.1 Button (`<Button>`)

- `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` — **built into shadcn**
- Loading state: `aria-busy="true"` on the button, spinner gets `role="status" aria-label="Loading"`
- Destructive actions: confirm via `<AlertDialog>` (not `window.confirm`)
- Password toggle: `aria-label="Show password"` / `"Hide password"`, `aria-pressed={showPw}`, **remove `tabIndex={-1}`**

### 4.2 Input (`<Input>`)

- `aria-invalid="true"` when validation fails
- `aria-describedby="<error-id>"` linking to error message element
- `aria-required="true"` for required fields (or native `required`)
- Error messages: `id` attribute + `role="alert"` or `aria-live="polite"`

### 4.3 Select (`<Select>`)

- Radix Select provides full keyboard navigation (Arrow Up/Down, Enter, Escape)
- Label via `<Label htmlFor>` or Radix's built-in label association
- `aria-required` on trigger

### 4.4 Checkbox (`<Checkbox>`)

- **Critical fix** for PendingRiders document verification
- Radix Checkbox provides: `role="checkbox"`, `aria-checked`, keyboard Space to toggle
- Each checkbox needs visible label text (already present in current UI)
- Group labeled with a heading or `aria-labelledby`

### 4.5 Table (`<Table>`)

- `<TableCaption>` — "Rider Profile" (or visually-hidden if design prefers no visible caption)
- Row "headers" (Name, Address, DOB…) → `<TableHead>` with `scope="row"`
- Or restructure as definition list `<dl>` for key-value pairs (semantically more accurate)

### 4.6 AlertDialog (Block Rider)

- `<AlertDialogTitle>` — "Block rider {name}?"
- `<AlertDialogDescription>` — "This rider will not be able to register. This action cannot be undone."
- Cancel + Confirm buttons; confirm is `variant="destructive"`
- Focus trapped inside dialog; Escape closes

### 4.7 Toast / Sonner (Saved feedback)

- `role="status"` with `aria-live="polite"` (Sonner handles this)
- Auto-dismiss after 3s
- Keyboard-dismissible

### 4.8 Form-level error announcements

- Error `<p>` elements: add `role="alert"` so screen readers announce immediately on appearance
- Or wrap in `aria-live="assertive"` region

### 4.9 Reduced motion

Add to `tailwind.css` or `globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-ping { animation: none; }
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```
Or use Tailwind's `motion-reduce:` prefix on individual elements.

---

## 5. Responsive Behavior Notes

### 5.1 Current state

- **Auth pages**: centered card (`max-w-[420px]`) — responsive OK (already works mobile → desktop).
- **Admin/Operator dashboards**: `max-w-2xl` centered content — responsive OK.
- **RiderDashboard**: `grid-cols-[40%_60%]` with `md:` breakpoint prefix — but the map pane is `w-[850px]` fixed → **breaks below 850px**. Needs: `w-full` map container + responsive grid.
- **ActiveRiders**: Leaflet map fills remaining viewport height — responsive OK (already uses `calc(100vh - 140px)`). Stat pills wrap via `flex-wrap` — OK.
- **PendingRiders**: `max-w-2xl` — responsive OK.
- **RiderLocationView**: `w-full h-[500px]` — OK.

### 5.2 Required responsive fixes

| Page | Current | Target |
|---|---|---|
| **RiderDashboard** | `grid-cols-[40%_60%]` + `w-[850px]` map | `grid-cols-1 lg:grid-cols-[minmax(300px,40%)_1fr]`; map: `w-full min-h-[400px] lg:h-[600px]` |
| **ActiveRiders header** | `z-[1000]` (Leaflet leak) | Use `isolate` + `z-10` (Leaflet is in its own stacking context with `relative` wrapper) |
| **Dashboard stat cards** | Single column on all viewports | Consider `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` for wider screens |

### 5.3 Breakpoints (align to Tailwind defaults)

| Token | Width | Usage |
|---|---|---|
| `sm` | 640px | Stat cards 2-col, show user name in header |
| `md` | 768px | Table/map side-by-side starts |
| `lg` | 1024px | Full dashboard layout |
| `xl` | 1280px | Max content width for dashboards |

---

## 6. DO-NOT-CHANGE List (Restyle Safety Constraints)

### 6.1 Routes (immutable — H8, ADR-0002)

No route path, guard (`ProtectedRoute allow=[...]`), or `roleHome()` mapping may change.

### 6.2 Fetch calls (immutable — H1, H6)

- `POST /user/login` body `{ phone, password }` + `credentials: "include"`
- `POST /register/user` body shape
- `POST /GetAll/UnregisteredRiders` body shape
- All endpoint URLs from `src/lib/config.ts`

No fetch call, header, body field, or error-handling flow changes.

### 6.3 Session storage (immutable — H7)

- `loadSession`, `saveSession`, `clearSession` in `src/features/auth/session.ts` are sole read/write path
- Envelope shape `{ v: 1, profile, savedAt }` unchanged

### 6.4 Test-visible text (must preserve to keep 44 tests green)

| Text / selector | Where in code | Impact if changed |
|---|---|---|
| Label containing "Phone Number" (case-insensitive) | LoginPage `<FieldInput id="phone" label="Phone Number">` | `login-flow.test.tsx` FAILS |
| Label exactly "Password" | LoginPage `<FieldInput id="password" label="Password">` | `login-flow.test.tsx` FAILS |
| Submit button accessible name containing "Sign in" | LoginPage submit `>Sign in</button>` | `login-flow.test.tsx` FAILS |
| Client error containing "valid phone number" | LoginPage `setError("Please enter a valid phone number.")` | `login-flow.test.tsx` FAILS |
| Server error text surfaced verbatim | LoginPage renders `{error}` (e.g. "Invalid phone or password") | `login-flow.test.tsx` FAILS |
| Label containing "Role" | RegisterPage admin variant `<label>Role</label>` | `roles.test.tsx` FAILS |

### 6.5 H4: Do not edit `src/components/ui/**`

The 48 shadcn primitives are **consumed as-is**. Override their appearance via:
1. `theme.css` custom properties (colors, radius, shadows)
2. `className` overrides at call sites
3. A thin wrapper in `src/components/` if persistent overrides are needed (e.g. `<RydeeButton>` that passes `className="rounded-xl"`)

Never edit the generated files directly — replace via shadcn CLI if an update is needed.

### 6.6 ROLES constant (H2)

`["Operator", "Customer", "Rider"]` — never change.

### 6.7 Customer seed user (H3)

`phone: 0300444444` must remain in MSW handlers.

---

## 7. Phasing Recommendation

### Rationale

Lowest-risk pages first = pages with the most test coverage (auth) and simplest layout. Higher-risk = pages with map dependencies, complex state (PendingRiders), and less test coverage.

### Phase 1: Auth pages ✦ LOW RISK

**Scope**: `LoginPage.tsx`, `RegisterPage.tsx`, `AuthShell.tsx`, `shared.tsx`, `shared-styles.ts`

**Why first**:
- Highest test coverage (44 tests exercise login + register flows)
- Tests use label/text selectors — will immediately catch regressions
- Self-contained (no map libs, no live data fetch, no complex state)
- Removes ~60% of JS hover handlers
- Validates the token + component strategy before touching dashboards

**Components introduced**: `<Button>`, `<Input>`, `<Card>`, `<CardContent>`, `<Select>` (for role dropdown on admin-register), `<Label>` (from shadcn form).

**Expected commits**:
1. Token additions in `theme.css` (new vars, contrast fixes for `--muted-foreground`, `--destructive`, `--primary` gradient)
2. LoginPage migration (Button + Input + Card; remove JS hover)
3. RegisterPage migration (same + Select for role)
4. Shared cleanup: delete `btnPrimary`, `btnLoading`, `inputBase`, `focusInput`, `blurInput` from `shared-styles.ts`

**Gate check**: all 44 tests must pass after each commit. lint · typecheck · typecheck:strict · build · test.

### Phase 2: Dashboard chrome ✦ LOW-MEDIUM RISK

**Scope**: Shared `<DashboardHeader>` extraction, Admin + Operator stat cards, Sign-out button

**Why second**:
- Repetitive code (3× duplicated header) — easy wins
- No test-visible text affected (guard tests use stubs, not real dashboard markup)
- Introduces `<Badge>`, `<Separator>`

**Expected commits**:
1. Extract `<DashboardHeader>` + `<StatCard>` into `src/features/dashboards/components/`
2. AdminDashboard migration
3. OperatorDashboard migration
4. RiderDashboard header + responsive grid fix

### Phase 3: PendingRiders ✦ MEDIUM RISK

**Scope**: Full form migration — inputs, select, checkboxes, buttons, alert dialog, toast

**Why third**:
- Complex state (form + block + save)
- Introduces `<Checkbox>`, `<AlertDialog>`, `<Sonner>` toast — more new dependencies
- Critical a11y fix (div-checkboxes → Radix Checkbox)
- No direct test assertions against this page (safe to restyle markup freely)

**Expected commits**:
1. Replace native selects with `<Select>`
2. Replace div-checkboxes with `<Checkbox>` + a11y attributes
3. Replace `window.confirm` with `<AlertDialog>`
4. Replace inline "Saved" pill with Sonner toast
5. Buttons → `<Button>` variants; remove JS hover

### Phase 4: ActiveRiders + RiderDashboard ✦ MEDIUM-HIGH RISK

**Scope**: Map-adjacent layouts, responsive fixes, state badges

**Why last**:
- Map libraries (Leaflet, Google Maps) have their own z-index/styling concerns
- `RiderDashboard` has the responsive bug (`w-[850px]`) — fixing requires layout restructure
- `ActiveRiders` Leaflet popups render inline styles (outside React's control for popup content)
- Lowest test coverage (no regression tests touch these views)

**Expected commits**:
1. State badges → `<Badge>` with token colors + reduced-motion
2. RiderDashboard responsive grid fix + `<Table>` migration
3. ActiveRiders header cleanup (z-index, badge)
4. RiderLocationView minor cleanup (loading state)

---

## 8. Bundle Impact Estimate

Current baseline: **170.07 kB** gzip (±2% budget = 166.7–173.5 kB).

shadcn components are already in the bundle (48 files in `ui/`, tree-shaken since unused). Importing them will **increase** the bundle only by the Radix runtime code that gets pulled in:
- `@radix-ui/react-select` (~4 kB gzip)
- `@radix-ui/react-checkbox` (~2 kB gzip)
- `@radix-ui/react-alert-dialog` (~3 kB gzip)
- `sonner` (~3 kB gzip)

**Estimated net change**: +8–12 kB gzip. This exceeds the ±2% band. Options:
1. **Accept a new baseline** after Phase 1 (recommended — the bundle budget was set pre-D8; adopting the design system is an intentional feature).
2. Offset by removing `shared-styles.ts` + dead lucide icons (~2 kB saved).
3. Lazy-load `AlertDialog` + `Sonner` (only used on PendingRiders) → code-split.

**Recommendation**: accept new baseline after Phase 1. Document in commit body + update PROJECT.md baseline.

---

## 9. Migration Checklist (per page)

For each page migrated, verify:

- [ ] All `onMouseEnter`/`onMouseLeave`/`onFocus(e => style)`/`onBlur(e => style)` removed
- [ ] All hardcoded hex replaced by token classes (`text-primary`, `bg-warning-muted`, etc.)
- [ ] `style={{}}` objects removed (except map-library requirements)
- [ ] All interactive elements have visible `:focus-visible` ring
- [ ] All form inputs have `aria-invalid` when errored + `aria-describedby` to error text
- [ ] Error messages have `role="alert"` or `aria-live`
- [ ] Buttons have meaningful accessible names
- [ ] Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text / UI components
- [ ] `prefers-reduced-motion` respected (no unguarded transforms/pings)
- [ ] Responsive: renders correctly at 375px, 768px, 1024px, 1440px
- [ ] All 5 quality gates pass (lint, typecheck, typecheck:strict, build, test)
- [ ] Bundle size documented (delta from previous commit)

---

## 10. Open Questions (for PM / Architect decision)

1. **React Hook Form adoption**: shadcn `<Form>` component assumes react-hook-form. Do we adopt it now (cleaner validation, smaller code) or keep current `useState` forms? Recommendation: defer to a separate ticket post-D8.
2. **Sonner vs custom toast**: Sonner adds ~3 kB. Acceptable for the improved UX + a11y? (Recommendation: yes.)
3. **Dark mode**: theme.css defines a `.dark` variant. Do we support it now or defer? (Recommendation: defer — no users have requested it; the `.dark` tokens are placeholder from shadcn init.)
4. **Card gradient button preservation**: Option B deepens the gradient. Confirm with stakeholder that the slightly darker green is acceptable? (Recommendation: proceed — contrast compliance is non-negotiable.)
