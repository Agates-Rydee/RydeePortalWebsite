# UX Spec — All Riders Admin Data-Table

> **Status**: Proposed (2026-07-30)  
> **Owner**: UI/UX Designer (spec) · Frontend Developer (implementation)  
> **Predecessor**: `docs/ux/restyle-spec.md` (Iter 3), `docs/ux/iter4-spec.md` (Iter 4)  
> **Engine assumption**: TanStack Table + shadcn `<Table>` primitives (canonical shadcn data-table pattern)  
> **Route**: `/admin/all-riders` (new) — `ProtectedRoute allow={["Operator"]}` (Admin is Operator role)

---

## 0. DO-NOT-CHANGE Constraints

| Constraint | Detail |
|---|---|
| **Routes & guards** | No existing path, `ProtectedRoute allow=[…]`, or `roleHome()` changes (H8, ADR-0002). New route additive only. |
| **Fetch calls** | Existing shapes byte-for-byte identical (H1). New endpoint additive — coordinate with ADR-0003. |
| **`src/components/ui/**`** | Never edit generated shadcn files (H4) |
| **Session storage** | Only via `session.ts` helpers (H7) |
| **ROLES constant** | `["Operator","Customer","Rider"]` (H2) |
| **Customer seed** | `phone: 0300444444` remains (H3) |
| **Endpoint URLs** | Always from `src/lib/config.ts` (H6) |

---

## 1. Layout

### 1.1 Page Shell

```
┌─────────────────────────────────────────────────────────┐
│  DashboardHeader (existing pattern — Logo + badge + logout) │
├─────────────────────────────────────────────────────────┤
│  ← Back to Dashboard    |    Page title: "All Riders"   │
├─────────────────────────────────────────────────────────┤
│  TOOLBAR                                                │
│  [ 🔍 Search riders...          ] [Status ▾] [Export ▼] │
├─────────────────────────────────────────────────────────┤
│  TABLE (full-width, card container)                     │
│  ┌─────┬──────┬──────┬───────┬──────┬────────┬────────┐│
│  │Name │Phone │CNIC  │Status │Area  │Joined  │Actions ││
│  ├─────┼──────┼──────┼───────┼──────┼────────┼────────┤│
│  │ …   │ …    │ …    │ …     │ …    │ …      │ …      ││
│  └─────┴──────┴──────┴───────┴──────┴────────┴────────┘│
├─────────────────────────────────────────────────────────┤
│  PAGINATION BAR                                         │
│  Showing 1–10 of 47 riders   [10▾]  [< 1 2 3 … 5 >]   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Container Strategy

- Outer: `max-w-7xl mx-auto px-6 py-8` (wider than existing `max-w-2xl` — data tables need horizontal space)
- Table wrapped in `<Card className="rounded-2xl border-border overflow-hidden">`
- Toolbar sits above the card, not inside it

### 1.3 Responsive Strategy: **Horizontal Scroll**

**Justification**: Data tables with 7+ columns lose meaning when stacked vertically. The canonical shadcn data-table pattern uses a scroll container (`overflow-x-auto`) on narrow viewports, preserving column relationships. Station monitors (1920×1080) render without scroll.

| Breakpoint | Behavior |
|---|---|
| Desktop ≥1280px | Full table visible, no scroll |
| Tablet 768–1279px | Horizontal scroll; sticky first column (Name) for context |
| Mobile <768px | Horizontal scroll; "Name" + "Status" columns prioritized via `min-w` |

Implementation: `<div className="overflow-x-auto">` wrapping `<Table>`.

---

## 2. Columns

### 2.1 Recommended Column Set

| # | Column | Field | Width | Align | Default Sort | Truncation | Notes |
|---|---|---|---|---|---|---|---|
| 1 | **Name** | `name` | `min-w-[160px]` | Left | — | Ellipsis at 24ch | Primary identifier |
| 2 | **Phone** | `phone` | `min-w-[130px]` | Left | — | None (fixed format) | Monospace: `font-mono text-sm` |
| 3 | **CNIC** | `cnic` | `min-w-[150px]` | Left | — | None (fixed format) | Monospace; XXXXX-XXXXXXX-X |
| 4 | **Status** | `status` | `min-w-[110px]` | Left | — | None | Badge component |
| 5 | **Area** | `area` | `min-w-[140px]` | Left | — | Ellipsis at 20ch | |
| 6 | **Joined** | `joinedAt` | `min-w-[100px]` | Left | **Default ↓ (newest first)** | None | Format: `DD MMM YYYY` |
| 7 | **Actions** | — | `w-[80px]` | Center | Not sortable | — | Kebab menu or icon button(s) |

### 2.2 Default Sort

`joinedAt` descending (newest first). Rationale: admins typically care about recently-onboarded riders.

### 2.3 Status Badge Styling

Reuses existing badge conventions from `ActiveRiders` + `PendingRiders`. Extends with two new states:

| Status | Token bg | Token text | Contrast (on bg) | Dot color |
|---|---|---|---|---|
| **Active** | `bg-success-muted` | `text-success` (`#15803d`) | 5.0:1 ✓ AA | `bg-success` |
| **Pending** | `bg-warning-muted` | `text-warning` (`#b45309`) | 4.6:1 ✓ AA | `bg-warning` |
| **Blocked** | `bg-destructive/10` | `text-destructive` (`#dc2626`) | 4.5:1 ✓ AA | `bg-destructive` |
| **Offboarded** | `bg-muted` | `text-muted-foreground` (`#4a6b5e`) | 5.1:1 ✓ AA | `bg-muted-foreground` |

Badge pattern (matching `ActiveRiders` convention):
```tsx
<Badge className={`${statusClass} gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full`}>
  <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
  {statusLabel}
</Badge>
```

### 2.4 New Tokens Required

```css
:root {
  /* Blocked state — reuses existing --destructive */
  /* Offboarded — reuses --muted-foreground + --muted (bg) — no new tokens */
}
```

No new tokens needed — all four states map to existing Palette A tokens.

---

## 3. Interactions

### 3.1 Sorting

**Affordance**: All column headers (except Actions) are sortable.

| Aspect | Spec |
|---|---|
| Visual indicator | Chevron icon in header: `↕` (unsorted), `↑` (asc), `↓` (desc) — muted when unsorted, `text-foreground` when active |
| Cycle | 3-state: unsorted → ascending → descending → unsorted |
| `aria-sort` | `"none"` / `"ascending"` / `"descending"` on `<th>` |
| Header element | `<button>` inside `<th>` (keyboard activatable, full header click target) |
| Multi-sort | Not MVP — single-column sort only |
| Focus | Focus remains on clicked header after sort change |

### 3.2 Status Filter

**Recommendation: Tabs** (not Select, not faceted checkboxes).

**Justification**:
- Only 4+1 options (All, Active, Pending, Blocked, Offboarded) — perfect for horizontal tabs
- Instantly visible state distribution without opening a dropdown
- Matches the mental model: "show me this slice"
- More discoverable than a Select buried in toolbar
- shadcn `<Tabs>` primitive available

Implementation:
```tsx
<Tabs defaultValue="all" onValueChange={setStatusFilter}>
  <TabsList className="bg-muted rounded-lg p-1">
    <TabsTrigger value="all">All <Badge>47</Badge></TabsTrigger>
    <TabsTrigger value="active">Active <Badge>32</Badge></TabsTrigger>
    <TabsTrigger value="pending">Pending <Badge>8</Badge></TabsTrigger>
    <TabsTrigger value="blocked">Blocked <Badge>5</Badge></TabsTrigger>
    <TabsTrigger value="offboarded">Offboarded <Badge>2</Badge></TabsTrigger>
  </TabsList>
</Tabs>
```

- Counts shown inline per tab (live-updating as data changes)
- Filter change resets pagination to page 1
- `aria-selected` built into Radix Tabs

### 3.3 Search

| Aspect | Spec |
|---|---|
| Input | shadcn `<Input>` with leading search icon (magnifying glass) |
| Placeholder | `"Search by name, phone, or CNIC…"` |
| Debounce | 300ms after last keystroke |
| Clear | `×` button appears when input non-empty; clears + refocuses input |
| Scope hint | Subtle text below or inside: not needed — placeholder makes scope clear |
| Empty query | Shows all (within current status filter) |
| Match logic | Case-insensitive substring on `name`, `phone`, `cnic` fields |
| Filter interaction | Search is AND-combined with status filter |
| Pagination | Resets to page 1 on search change |

### 3.4 States (Distinct Copy Each)

| State | Visual | Copy |
|---|---|---|
| **Loading** | Skeleton rows (6 rows × all columns, shimmer animation) | — (no text, visual skeleton communicates loading) |
| **Empty (no riders exist)** | Centered illustration + text in card | "No riders registered yet. Riders will appear here once they complete registration." |
| **No results (filter/search yields 0)** | Centered icon + text | "No riders match your search." + secondary: "Try adjusting your filters or search term." + `<Button variant="link">Clear filters</Button>` |
| **Error (fetch failed)** | Destructive-tinted card | "Failed to load riders. Please try again." + `<Button>Retry</Button>` |

### 3.5 Row Count Display

Integrated into pagination bar (§3.7). Format: `"Showing 1–10 of 47 riders"` (or `"Showing 1–3 of 3 riders (filtered from 47)"` when filter/search active).

### 3.6 Export Button

| Aspect | Spec |
|---|---|
| Trigger | `<Button variant="outline" size="sm">` with download icon + "Export" label |
| Dropdown | shadcn `<DropdownMenu>` with two items: "Export as CSV" / "Export as XLSX" |
| Scope | **Exports the CURRENT filtered/searched view** (not all data) |
| Clarity UX | Button label dynamically shows scope: "Export 8 riders" (or "Export all 47 riders" when unfiltered) — makes scope unambiguous |
| Filename | `rydee-riders-{status}-{YYYY-MM-DD}.csv` (e.g. `rydee-riders-active-2026-07-30.csv`) |
| Columns exported | All visible columns except Actions |
| Status exported as | Plain text label ("Active", "Pending", etc.) |

### 3.7 Pagination Bar (MVP — Confirmed Requirement)

#### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Showing 1–10 of 47 riders    Rows per page: [10▾]   [< 1 2 3 … 5 >] │
└────────────────────────────────────────────────────────────────┘
```

#### Rows-Per-Page Selector

| Aspect | Spec |
|---|---|
| Component | Native `<select>` with `.select-field` class (matches PendingRiders pattern — lightweight) |
| Default | **10 rows** |
| Options | `[10, 25, 50, 100]` |
| Label | `"Rows per page:"` (visible, associated via `<Label htmlFor>`) |
| On change | Reset to page 1; focus stays on selector |

#### Page Controls

| Aspect | Spec |
|---|---|
| Pattern | **Prev/Next buttons + numbered page buttons** (truncated with ellipsis for >7 pages) |
| Prev/Next | `<Button variant="outline" size="icon">` with chevron icons; `disabled` on first/last page |
| Page numbers | Show: `[1] [2] [3] … [last]` when >7 pages; always show first, last, and 2 neighbors of current |
| Current page | `<Button variant="default">` (filled primary) — visually distinct |
| Other pages | `<Button variant="outline">` |
| Ellipsis | Non-interactive `<span>…</span>` (not a button) |

#### Keyboard Accessibility

| Key | Action |
|---|---|
| `Tab` | Moves between rows-per-page select, prev, page numbers, next |
| `Enter` / `Space` | Activates focused page button |
| Prev/Next when disabled | `aria-disabled="true"`, no action, remains focusable for SR context |

#### Focus Management on Page Change

- **On page button click**: focus moves to the **first data row** of the new page (`<tr tabIndex={-1}>` receives programmatic `.focus()`)
- **On rows-per-page change**: focus stays on the selector
- **Rationale**: moving focus to data confirms the page changed for keyboard/SR users; standard data-table pattern (WAI-ARIA APG)

#### Interaction with Filters/Search

- Any filter change (status tab, search input) **resets to page 1**
- Sort change does NOT reset page (user expects same page, re-ordered)
- `"Showing X–Y of Z riders"` updates as a **live region** (`aria-live="polite"`) — SR announces count changes

#### Showing-Count Format

| Scenario | Text |
|---|---|
| Unfiltered | `"Showing 1–10 of 47 riders"` |
| Filtered | `"Showing 1–8 of 8 riders (filtered from 47)"` |
| Single page | `"Showing all 8 riders"` (suppress pagination controls) |
| Zero results | Hidden (empty/no-results state takes over) |

---

## 4. Accessibility

### 4.1 Table Semantics

| Requirement | Implementation |
|---|---|
| `<table>` element | Use shadcn `<Table>` (renders `<table>`) — NOT div-based grid |
| Caption | `<TableCaption className="sr-only">All riders — sortable, filterable</TableCaption>` |
| Column headers | `<TableHead>` with `scope="col"` |
| `aria-sort` | On every sortable `<th>`: `"none"` / `"ascending"` / `"descending"` |
| Row headers | First cell (`name`) gets `scope="row"` for data rows |

### 4.2 Keyboard Navigation

| Element | Keyboard |
|---|---|
| Sort headers | `Tab` to reach header row; `Enter`/`Space` to cycle sort |
| Search input | Standard text input; `Escape` clears (or closes if empty) |
| Status tabs | `Arrow Left/Right` between tabs (Radix Tabs built-in) |
| Export dropdown | `Enter` opens; `Arrow Up/Down` navigates; `Enter` selects; `Escape` closes |
| Pagination | `Tab` between controls; `Enter`/`Space` activates |
| Table rows | `Tab` to action buttons within rows; no mandatory row-by-row tab stop (avoids trap) |

### 4.3 Live Regions

| Region | `aria-live` | Content |
|---|---|---|
| Result count (`"Showing X–Y of Z"`) | `polite` | Updates on filter/search/page change |
| Error state | `assertive` (via `role="alert"`) | Announces fetch failure |
| Export feedback | `polite` (via `role="status"`) | "Export complete — 8 riders downloaded" |

### 4.4 Focus Management

| Trigger | Focus target |
|---|---|
| Filter/search change | Stays in place (no forced move) |
| Page change (pagination click) | First `<tr>` of new page data |
| Export complete | Stays on export button |
| Error → Retry click | Loading state → on success, first data row |

### 4.5 Color & Motion

- All status badges pass WCAG AA (see §2.3 contrast table)
- Sort indicator uses both color AND icon shape (not color-alone)
- Skeleton shimmer respects `prefers-reduced-motion` (existing global rule in `theme.css`)
- Focus rings: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (shadcn built-in)

---

## 5. Navigation Hook — "Total Riders" StatCard

The existing `<StatCard label="Total Riders">` on `AdminDashboard` (line 126–138) currently has **no onClick**. Make it clickable:

```tsx
<StatCard
  label="Total Riders"
  value={totalRiders}
  onClick={() => onNavigate("all-riders")}
  hint="View all riders →"
  icon={/* existing icon */}
/>
```

This gives the feature a natural discovery point without adding nav items (consistent with Active/Pending card pattern).

---

## 6. More Possibilities — MVP / Fast-Follow / Later

| Feature | Tier | Effort | Justification |
|---|---|---|---|
| Status filter (tabs) | **MVP** | S | Core requirement; 4 states are the primary admin workflow lens |
| Full-text search (name/phone/CNIC) | **MVP** | S | Core requirement |
| Sortable column headers | **MVP** | S | Core requirement; TanStack Table provides this near-free |
| Export CSV/XLSX (filtered view) | **MVP** | M | Core requirement; needs client-side xlsx lib (~15 kB) |
| Pagination (prev/next + numbered) | **MVP** | M | Confirmed requirement; TanStack pagination utilities |
| Rows-per-page selector | **MVP** | S | Part of pagination; trivial with TanStack `pageSize` state |
| Row count / filtered count display | **MVP** | S | Essential feedback for filter/search |
| URL-persisted filters (shareable/bookmarkable) | **Fast-follow** | S | Sync `?status=active&q=khan&page=2` to URL params; ~30 LOC with `useSearchParams` |
| Row click → rider detail slide-over | **Fast-follow** | M | High admin value — opens PendingRiders-like form in a sheet; avoids full page nav |
| Column show/hide (column visibility toggle) | **Fast-follow** | S | TanStack `columnVisibility` state + shadcn `<DropdownMenu>` with checkboxes |
| Sticky table header on scroll | **Fast-follow** | S | CSS `position: sticky; top: 0` on `<thead>`; visual separator on scroll |
| Date-range filter on "Joined" | **Later** | M | shadcn DateRangePicker (not yet installed); low priority until rider volume >200 |
| Bulk actions (block/offboard multiple) | **Later** | L | Requires checkbox column, selection state, batch API endpoint (not available) |
| Per-page selector in URL | **Later** | XS | Depends on URL-persisted filters being in place first |
| Print view / print CSS | **Later** | S | `@media print` stylesheet; low demand |
| Inline row editing | **Later** | L | Complex — edit mode per cell, validation, optimistic update; overkill for admin |
| Real-time row updates (WebSocket/SSE) | **Later** | XL | Backend doesn't support push; poll is fine for admin use case |

### Top 3 "Missing Possibilities" Picks (high value, should strongly consider for fast-follow):

1. **URL-persisted filters** — zero extra deps, trivial effort, massive UX win (admins share links in Slack: "look at blocked riders in DHA")
2. **Row click → rider detail sheet** — avoids building a separate detail page; reuses PendingRiders form pattern in a `<Sheet>` (shadcn primitive available)
3. **Sticky header** — pure CSS, zero deps; on data tables with 50+ rows this is table-stakes UX that avoids "scroll up to remember what column I'm reading"

---

## 7. Data Shape (Mock / API Coordination)

### 7.1 Unified Rider Type (proposed extension to `src/types/rider.ts`)

```typescript
export type RiderStatus = "active" | "pending" | "blocked" | "offboarded";

export interface AllRidersRow {
  id: number;
  name: string;
  phone: string;
  cnic: string;
  status: RiderStatus;
  area: string;
  joinedAt: string; // ISO date
}
```

### 7.2 Mock Data Source

Combine `INITIAL_ACTIVE_RIDERS` + `PENDING_RIDERS` into a unified mock handler (`src/mocks/handlers/riders.ts`) that returns the `AllRidersRow[]` shape. Add `blocked` / `offboarded` seed entries (2–3 each) for filter testing.

### 7.3 API Endpoint (additive — H1 safe)

`GET /riders/all` or `POST /riders/list` (coordinate with backend via ADR-0003 addendum). Register URL in `src/lib/config.ts` as `API_GET_ALL_RIDERS_URL`.

---

## 8. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Task success: find a specific rider by CNIC | >95% | Usability session (N=3–5 admins) |
| Time-on-task: locate blocked riders | <10s | Stopwatch in session |
| SUS score (table page) | ≥75 | Post-session questionnaire |
| Export accuracy | 100% match between screen and file | QA regression (automated) |
| Accessibility audit (axe-core) | 0 violations | CI gate |
| Pagination: admin finds page 3 of active riders | <5s | Usability session |

---

## 9. Implementation Notes (for Frontend Developer)

- **TanStack Table** (`@tanstack/react-table`) provides sorting, filtering, pagination state management — ~12 kB gzip
- **Export**: use `xlsx` (~90 kB gzip) or lighter `csv-stringify` for CSV-only MVP; recommend CSV-only for MVP, XLSX as fast-follow
- **shadcn components used**: `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>`, `<TableCaption>`, `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<Input>`, `<Button>`, `<Badge>`, `<Card>`, `<DropdownMenu>`, `<Select>` (for rows-per-page if Radix preferred over native)
- **File location**: `src/features/riders/AllRiders.tsx` (page) + `src/features/riders/components/` (table sub-components)
- **Route addition**: additive in `router.tsx` — `{ path: "all-riders", element: <AllRiders /> }` within admin layout
- **Bundle impact estimate**: TanStack Table (~12 kB) + CSV export (~3 kB) = ~15 kB gzip. Within acceptable growth for a major new feature. XLSX deferred to fast-follow to avoid +90 kB.

---

## 10. Open Questions

1. **API pagination**: Client-side (load all, paginate in browser) vs server-side (paginated API)? Recommend **client-side for MVP** (rider count likely <500 at DBX8 scale); revisit if >1000.
2. **Actions column content**: What actions? Recommend MVP: "View" icon-button (→ rider detail, fast-follow). Block/offboard actions belong in the detail view, not inline.
3. **"Joined" date source**: Not in current `PendingRider` / `ActiveRider` types. Mock handler should synthesize; real API must provide. Flag in ADR-0003 addendum.
4. **CNIC masking**: Should CNIC display masked (XXXXX-XXXX***-X) for privacy? Recommend: show full to Admin role (they need it for verification). Defer masking to a "viewer role" if/when introduced.
