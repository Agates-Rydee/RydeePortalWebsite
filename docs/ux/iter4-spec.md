# Iteration 4 UX Spec — Form Validation, Datepicker, Cursor, Select, Clickable Cards

> **Status**: Proposed (2026-07-30)  
> **Predecessor**: `docs/ux/restyle-spec.md` (Iter 3 — D8 shadcn adoption)  
> **Owner**: UI/UX Designer (spec) · Frontend Developer (implementation)  
> **Scope**: 5 items — all UX/a11y polish; no route, guard, fetch, or test-contract changes.

---

## Product Decisions Amendment (2026-07-30 — owner: Danial Khan)

> **Resolves QA Iter 4 F2 (INFO).** The following product decisions supersede draft values in this spec:
>
> | Item | Spec Draft Value | **Decision** |
> |------|-----------------|--------------|
> | Minimum age (§1.3 dob validation, §2.3 picker bounds) | 16 years | **18 years minimum** (enforced in client validation and datepicker year range) |
> | DOB wire format to backend (`dob` field in `POST /register/user`) | Not explicitly specified | **ISO YYYY-MM-DD** — UI displays DD/MM/YYYY; submission converts to ISO. Documented in ADR-0003 §dob footnote. |
>
> All other §1.3 and §2.3 values remain as written. No spec body rewrite needed — this amendment is the canonical record.

---

## 0. DO-NOT-CHANGE Reminder

These are **immutable** throughout Iteration 4 (H-rules + test contracts):

| Constraint | Detail |
|---|---|
| **Routes & guards** | No path, `ProtectedRoute allow=[…]`, or `roleHome()` changes (H8, ADR-0002) |
| **Fetch calls** | `POST /user/login` body `{ phone, password }`, `POST /register/user` body `{ name, email, phoneNumber, dob, address, password, role }`, both `credentials:"include"` — shapes byte-for-byte identical (H1) |
| **44 regression tests** | All label text, button names, error strings in §6.4 of restyle-spec preserved verbatim |
| **`src/components/ui/**`** | Never edit generated shadcn files (H4) |
| **Session storage** | Only via `session.ts` helpers (H7) |
| **ROLES constant** | `["Operator","Customer","Rider"]` (H2) |
| **Customer seed** | `phone: 0300444444` remains (H3) |
| **Endpoint URLs** | Always from `src/lib/config.ts` (H6) |

---

## 1. Form Validation Matrix

### 1.1 Design Principles

- **Client-side gate only** — validation prevents obviously-bad submissions; the fetch body shape/format MUST remain identical to H1. No field transforms (e.g., do NOT strip dashes from phone before submit — if the backend accepts raw, send raw).
- **Timing**: validate **on blur** (field loses focus) + **on submit** (full re-check). Never on keystroke — avoids premature "invalid" feedback while typing.
- **Error presentation** (per restyle-spec §4.2 patterns):
  - Field gets `aria-invalid="true"`
  - Error `<p>` rendered below field with unique `id`
  - Field gets `aria-describedby="<error-id>"`
  - Error `<p>` gets `role="alert"` (assertive announce on appear)
  - Visual: `text-destructive text-xs mt-0.5` (matches existing `reg-confirm-error`)
- **Mechanism**: spec is UX-only — implementer may use `react-hook-form` (already in deps) with resolver, or keep manual `useState` + blur handlers. Either is compliant.

### 1.2 LoginPage Field Rules

| Field | ID | Rule | Error Message |
|---|---|---|---|
| Phone Number | `phone` | Required + `/^\d{10}$/` (already enforced on-submit) | `"Enter a 10-digit phone number."` |
| Password | `password` | Required, non-empty | `"Enter your password."` |

**Note**: LoginPage already enforces these on submit. Iteration 4 adds:
1. **On-blur** check for phone (show error if field blurred with invalid value)
2. Per-field `aria-invalid` + `aria-describedby` wiring (currently only a single `role="alert"` paragraph exists)

### 1.3 RegisterPage Field Rules

| Field | ID | Rule | Error Message |
|---|---|---|---|
| Name | `reg-name` | Required, ≥ 2 chars | `"Enter your full name."` |
| Email | `reg-email` | Required, valid email format (`/.+@.+\..+/`) | `"Enter a valid email address."` |
| Phone | `reg-phone` | Required, 10–11 digits (`/^\d{10,11}$/`) | `"Enter a valid phone number (10–11 digits)."` |
| Date of birth | `reg-dob` | Required, valid date, age 16–100 | `"Enter a valid date of birth (DD/MM/YYYY)."` |
| Address | `reg-address` | Required, ≥ 5 chars | `"Enter your home address."` |
| Password | `reg-password` | Required, ≥ 8 chars | `"Password must be at least 8 characters."` |
| Confirm password | `reg-confirm` | Required, must match password | `"Passwords do not match."` (existing) |
| Role | `reg-role` | Required when `showRole=true` | `"Select a role."` |

### 1.4 PendingRiders Selects

The rider-select (`#rider-select`) and area-select (`#pr-area`) are operational form controls, not auth-gating fields. **No client validation needed** — they already use `disabled` placeholder options. No change required for validation wiring.

### 1.5 Submit Behavior

- On submit: run all field rules synchronously
- If any fail: focus the first invalid field, announce error via `role="alert"`, prevent fetch
- On server error (non-2xx): display verbatim server text in the existing general error `<p role="alert">` (no change to current behavior)
- **CRITICAL**: the `JSON.stringify` body passed to fetch MUST NOT be altered by validation logic. Validation gates the call; it does not transform the payload.

---

## 2. Datepicker — Register DOB Field

### 2.1 Component

Use **shadcn Calendar** (`src/components/ui/calendar.tsx`) + **Popover** (`src/components/ui/popover.tsx`) — both already installed.

### 2.2 Interaction Spec

| Aspect | Decision | Rationale |
|---|---|---|
| Trigger | **Button icon** (calendar icon) appended inside the existing text input | Users can still type DD/MM/YYYY manually; button opens picker as alternative |
| Text input | Remains typeable (`inputMode="numeric"`, placeholder `DD/MM/YYYY`) | Faster for users who know their DOB; essential for a11y |
| Popover position | `align="start"` below field | Standard date-picker placement |
| Close | On date selection, on Escape, on outside click | Radix Popover default behavior |

### 2.3 Year/Month Navigation (Critical for DOB)

Default `react-day-picker` (used by shadcn Calendar) shows one month at a time — unusable for DOB (users born 1950–2010 would click 300+ times).

**Required**: use the `captionLayout="dropdown"` prop (react-day-picker v9) to render year + month as `<select>` dropdowns in the caption. Configure:

```
fromYear={1940}
toYear={new Date().getFullYear() - 16}   // minimum age 16
captionLayout="dropdown"
```

This gives instant decade-jump via year dropdown — no month-by-month clicking.

### 2.4 Submitted Date Format

| Aspect | Value |
|---|---|
| **Display format** (in text input) | `DD/MM/YYYY` (matches existing placeholder) |
| **Submitted `dob` field value** | `DD/MM/YYYY` string — e.g. `"25/12/1995"` |
| **Mock seed format** | MSW seeds currently use ISO (`1998-03-15`). Handler must accept both OR seeds updated to `DD/MM/YYYY`. |

**⚠️ Open flag**: Backend contract for `dob` format is not explicitly frozen in ADR-0003. If backend expects ISO, a follow-up ADR amendment is needed. For now, match the UI placeholder (`DD/MM/YYYY`) as canonical and document the discrepancy.

### 2.5 Accessibility

- Popover trigger button: `aria-label="Open date picker"`
- Calendar: keyboard navigable (Arrow keys = day, PageUp/Down = month) — built into react-day-picker
- Focus returns to trigger button on close
- Text input remains the primary labeled control (`<Label htmlFor="reg-dob">`)
- Screen reader announces selected date on pick

---

## 3. Cursor Bug — Missing `cursor-pointer`

### 3.1 Root Cause

Tailwind CSS v4 uses modern CSS preflight which sets `cursor: default` on `<button>` elements (aligning with CSS spec). This removes the pointer cursor from all buttons and clickable elements site-wide.

### 3.2 Fix Spec

Add a **global base-layer rule** in `src/styles/index.css` (or `theme.css`):

```css
@layer base {
  /* Restore pointer cursor for interactive elements (Tailwind v4 preflight sets default) */
  button:not(:disabled),
  [role="button"]:not(:disabled),
  a[href],
  select:not(:disabled),
  summary,
  [tabindex]:not([tabindex="-1"]):not(:disabled) {
    cursor: pointer;
  }

  /* Disabled elements */
  button:disabled,
  [role="button"][aria-disabled="true"],
  select:disabled,
  input:disabled {
    cursor: not-allowed;
  }
}
```

### 3.3 Exceptions

| Element | Cursor | Reason |
|---|---|---|
| Disabled buttons | `not-allowed` | Communicates non-interactivity |
| Read-only inputs (Age, PIN in PendingRiders) | `default` | Already have `cursor-default` class |
| `tabIndex={-1}` elements | `default` | Not keyboard-reachable, not clickable |

### 3.4 Scope

This is a **single global rule** — no per-component changes needed. Affects all existing buttons, links, and selects immediately.

---

## 4. PendingRiders Select Regression

### 4.1 Bug Description (confirmed via screenshots)

The native `<select>` elements on PendingRiders (`#rider-select`, `#pr-area`) render as **bare text with a chevron** — no white background, no border, no visible input container. They blend into the page background (`bg-background` = `#f0faf7`).

**Root cause**: the select elements have `bg-input-background` class but the actual computed background is transparent or matches the page. The border + background tokens are not resolving to the same visual treatment as `<Input>`.

### 4.2 Fix Spec

Create a shared CSS class (`.select-field`) or a thin `<SelectField>` wrapper that gives native `<select>` elements visual parity with shadcn `<Input>`:

```css
/* In theme.css or index.css @layer components */
@layer components {
  .select-field {
    @apply w-full rounded-xl px-4 py-3 text-sm
           bg-white border border-input text-foreground
           appearance-none outline-none transition-shadow
           focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px];
    background-image: url("data:image/svg+xml,%3Csvg xmlns='\''http://www.w3.org/2000/svg'\'' width='\''16'\'' height='\''16'\'' viewBox='\''0 0 24 24'\'' fill='\''none'\'' stroke='\''%234a6b5e'\'' stroke-width='\''2'\'' stroke-linecap='\''round'\'' stroke-linejoin='\''round'\''%3E%3Cpath d='\''M6 9l6 6 6-6'\''/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 2.5rem;
  }
}
```

### 4.3 Key Visual Properties

| Property | Value | Matches |
|---|---|---|
| Background | `bg-white` (explicit, not token-dependent on page bg) | shadcn `<Input>` |
| Border | `border border-input` (1px solid, muted green) | shadcn `<Input>` |
| Border radius | `rounded-xl` (12px) | All other form fields |
| Focus ring | `focus-visible:ring-[3px] ring-ring/50 border-ring` | shadcn `<Input>` |
| Chevron | SVG background-image, right-aligned | RegisterPage role select (already works) |
| Height/padding | `px-4 py-3` (~46px effective) | Matches Input `h-auto rounded-xl px-4 py-3` |

### 4.4 Implementation Note

- **Keep native `<select>`** — previous UX ruling (deviation #2, restyle-spec) confirmed native is correct (Radix Select adds ~20 kB gzip).
- The RegisterPage role `<select>` already HAS this styling (lines 148–153 in RegisterPage.tsx with explicit `bg-input-background border border-input`). The issue is `bg-input-background` resolving differently on PendingRiders'\''s `bg-background` page vs the Card background on RegisterPage. Fix: use `bg-white` explicitly (or `bg-card`).

### 4.5 Affected Elements

| Element | File | ID |
|---|---|---|
| Rider picker | `PendingRiders.tsx:125-137` | `#rider-select` |
| Area select | `PendingRiders.tsx:169-181` | `#pr-area` |
| Role select (RegisterPage) | `RegisterPage.tsx:144-163` | `#reg-role` — verify it also renders correctly; if yes, no change needed |

---

## 5. Clickable Stat Cards

### 5.1 Current State

`StatCard` renders a `<Card>` (div) containing a `<Button variant="link">` for the numeric value when `onClick` is provided. This creates:
- ❌ Small click target (only the number text is clickable)
- ❌ No hover feedback on the card itself
- ❌ Non-obvious interactivity (no cursor, no elevation change)
- ❌ Potential nested-interactive violation if future content adds links

### 5.2 Target Behavior

When `onClick` is provided, the **entire card** becomes the interactive element.

### 5.3 Implementation Pattern (Recommended: button-card)

Render the card root as a `<button>` element (not a link — there is no URL; `onNavigate` is a callback):

```tsx
// When onClick is present:
<Card
  as="button"           // or wrap Card in <button>
  onClick={onClick}
  className="... cursor-pointer hover:shadow-lg hover:-translate-y-0.5
             focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
             transition-all duration-200"
  aria-label={ariaLabel} // e.g. "View 5 pending riders"
>
  {/* card content — NO nested interactive elements */}
</Card>
```

Since shadcn `<Card>` renders a `<div>`, the simplest approach: wrap card content in a `<button>` that spans the full card, or pass `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space). Recommend the `<button>` wrapper approach for semantic correctness.

### 5.4 Interaction States

| State | Visual | Implementation |
|---|---|---|
| Default | Current card appearance | Base styles |
| Hover | Elevated shadow + slight lift (-1px translateY) | `hover:shadow-lg hover:-translate-y-0.5` |
| Focus-visible | 2px ring (primary) + offset | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |
| Active/pressed | Scale down slightly | `active:scale-[0.98]` |
| Loading (value=null) | Card not interactive (no onClick behavior until data loads) | Conditionally omit onClick when value is null |

### 5.5 Accessibility

| Requirement | Implementation |
|---|---|
| `aria-label` | Dynamic: `"View {value} {label.toLowerCase()}"` — e.g. `"View 5 pending riders"`, `"View 12 active riders"` |
| Keyboard activation | Native `<button>` handles Enter + Space |
| No nested interactives | Remove the inner `<Button variant="link">` when card is clickable — the number renders as plain `<p>` since the whole card is the action |
| Reduced motion | `motion-reduce:transform-none motion-reduce:transition-none` |
| Role announcement | Native `<button>` — SR announces "button, View 5 pending riders" |

### 5.6 Affected Instances

| Dashboard | StatCard | `onClick` target |
|---|---|---|
| Admin | Active Riders (value) | `onNavigate("active-riders")` |
| Admin | Pending Riders (value) | `onNavigate("pending-riders")` |
| Operator | Active Riders (value) | `onNavigate("active-riders")` |
| Operator | Pending Riders (value) | `onNavigate("pending-riders")` |
| Admin | Total Riders | No onClick — stays non-interactive |

### 5.7 No-Nested-Interactive Rule

When the card is a `<button>`:
- The inner value MUST be a `<span>` or `<p>`, NOT a `<Button>` or `<a>`
- The hint text ("Tap to view live map →") becomes part of the button'\''s content (announced by SR as part of label or described-by)
- Remove `hint` prop from clickable cards OR render as `aria-describedby` text

---

## 6. Risk Assessment & Phasing Order

### Recommended Implementation Order

| Phase | Item | Risk | Rationale |
|---|---|---|---|
| **1** | §3 Cursor bug | 🟢 Trivial | Single CSS rule; zero component changes; zero test risk |
| **2** | §4 Select regression | 🟢 Low | CSS class fix + explicit `bg-white`; no logic change; visual-only |
| **3** | §5 Clickable stat cards | 🟡 Low-Medium | Refactors `StatCard` component; no tests assert against it; verify no nested-interactive warnings |
| **4** | §1 Form validation | 🟡 Medium | Touches LoginPage + RegisterPage; 44 tests exercise these — must preserve all text/labels exactly; on-blur wiring is new behavior |
| **5** | §2 Datepicker | 🟠 Medium-High | New Radix Popover + Calendar integration; date format discrepancy with mock seeds; needs ADR-0003 flag |

### Risk Notes

- **§1 + §4 (validation)**: The existing error text `"Please enter a valid phone number."` must remain verbatim (test-visible, restyle-spec §6.4). New per-field errors are additive (shown on blur) but the submit-time error path must produce identical strings.
- **§2 (datepicker)**: `dob` format mismatch (DD/MM/YYYY display vs ISO in seeds) — coordinate with backend/mock handler update in same commit.
- **§5 (stat cards)**: If any test queries `getByRole("link")` inside stat cards, the switch from `<Button variant="link">` to card-level `<button>` would break it. Verify no such assertion exists (current test suite does not exercise dashboards — safe).

---

## 7. Success Metrics

| Item | Metric | Target |
|---|---|---|
| Form validation | Submit attempts with empty/invalid fields (dev console log) | 0 invalid payloads reach fetch |
| Datepicker | Time-on-task for DOB entry (usability session) | < 10s (vs current free-text guess) |
| Cursor bug | User-reported "nothing looks clickable" feedback | Eliminated |
| Select regression | Visual parity with Input (manual QA screenshot) | Border + bg visible on page bg |
| Clickable cards | Click-through rate on stat cards (future analytics) | Baseline establishment |

---

## 8. Gate Criteria (same as all iterations)

Before merging each phase commit:
- `npm run lint` — 0 errors
- `npm run typecheck` — 0 errors  
- `npm run typecheck:strict` — 0 errors
- `npm run build` — clean
- `npm test` — 44/44 passing
- Bundle delta documented (expect ≤ +2 kB for items 1–4; item 5 may add ~1–2 kB for Calendar/Popover runtime if not already tree-shaken in)