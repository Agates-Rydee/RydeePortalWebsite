// ADR-0004: All Riders admin data table. UX spec: docs/ux/riders-table-spec.md.
//
// Hand-rolled sort/filter/paginate over a client-side array — no TanStack
// Table dep (band headroom, MVP scope). Rendered on shadcn <Table> primitives.
// Endpoint URL from src/lib/config.ts (H6). Status enum:
//   active | pending | blocked | offboarded (ADR-0004 §D3).
//
// Fast-follows (2026-07-31):
//   • URL-persisted filters via useSearchParams — status, q, sort, dir, page,
//     pageSize. Defaults omitted from the URL. Invalid params fall back to
//     defaults silently (never throw).
//   • Sticky <thead> on scroll (position: sticky).
//   • Row → detail Sheet: click a row, Enter/Space when focused. Esc closes,
//     focus returns to the row (Radix + explicit restore).
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useSearchParams } from "react-router";
import { API_GET_ALL_RIDERS_URL } from "@/lib/config";
import type { AllRidersRow, RiderStatus } from "@/types/rider";
import { mapAllRidersResponse } from "@/features/riders/mapper";
import {
  csvFilename,
  downloadCsv,
  ridersToCsv,
} from "@/features/riders/csv";
import { RiderDetailSheet } from "@/features/riders/RiderDetailSheet";
import { BackButton, Logo } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StatusTab = "all" | RiderStatus;

interface WireResponse {
  riders?: Array<Record<string, unknown>>;
}

type SortKey = "name" | "phone" | "cnic" | "status" | "area" | "joinedAt";
type SortDir = "asc" | "desc";
interface SortState {
  key: SortKey;
  dir: SortDir;
}
// Default sort: joinedAt desc (newest first) — UX spec §2.2.
const DEFAULT_SORT: SortState = { key: "joinedAt", dir: "desc" };

const STATUS_TABS: readonly StatusTab[] = [
  "all",
  "active",
  "pending",
  "blocked",
  "offboarded",
];
const TAB_LABEL: Record<StatusTab, string> = {
  all: "All",
  active: "Active",
  pending: "Pending",
  blocked: "Blocked",
  offboarded: "Offboarded",
};

const STATUS_BADGE: Record<RiderStatus, string> = {
  active: "bg-success-muted text-success border-success/25",
  pending: "bg-warning-muted text-warning border-warning/25",
  blocked: "bg-destructive/10 text-destructive border-destructive/25",
  offboarded: "bg-muted text-muted-foreground border-border",
};

const PAGE_SIZES = [10, 25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];
const DEFAULT_PAGE_SIZE: PageSize = 10;

const SORT_KEYS: readonly SortKey[] = [
  "name",
  "phone",
  "cnic",
  "status",
  "area",
  "joinedAt",
];

function formatJoined(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Debounce a value by `ms` ms. Used for the 300ms search input. */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function compare(
  a: AllRidersRow,
  b: AllRidersRow,
  key: SortKey,
  dir: SortDir,
): number {
  const av = a[key] ?? "";
  const bv = b[key] ?? "";
  const cmp = String(av).localeCompare(String(bv), undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return dir === "asc" ? cmp : -cmp;
}

// ─── URL param helpers ─────────────────────────────────────────────────
// Read-once at mount, then written on every state change. Defaults are
// omitted so URLs stay short and shareable. Invalid params → defaults.

function readStatusTab(sp: URLSearchParams): StatusTab {
  const v = sp.get("status");
  return (STATUS_TABS as readonly string[]).includes(v ?? "")
    ? (v as StatusTab)
    : "all";
}

function readSort(sp: URLSearchParams): SortState {
  const key = sp.get("sort");
  const dir = sp.get("dir");
  const validKey = (SORT_KEYS as readonly string[]).includes(key ?? "");
  const validDir = dir === "asc" || dir === "desc";
  if (!validKey || !validDir) return DEFAULT_SORT;
  return { key: key as SortKey, dir: dir as SortDir };
}

function readPageSize(sp: URLSearchParams): PageSize {
  const n = Number(sp.get("pageSize"));
  return (PAGE_SIZES as readonly number[]).includes(n)
    ? (n as PageSize)
    : DEFAULT_PAGE_SIZE;
}

function readPage(sp: URLSearchParams): number {
  const n = Number(sp.get("page"));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export default function AllRiders({ onBack }: { onBack: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read-once init from URL. State is source-of-truth after mount; the effect
  // below writes back to the URL. This keeps refresh + back-button working
  // without a two-way reactive loop (which would fight react-router).
  const initialParams = useRef(searchParams).current;

  const [rows, setRows] = useState<AllRidersRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [statusTab, setStatusTab] = useState<StatusTab>(() =>
    readStatusTab(initialParams),
  );
  const [searchInput, setSearchInput] = useState(() => initialParams.get("q") ?? "");
  const debouncedSearch = useDebounced(searchInput, 300);
  const [sort, setSort] = useState<SortState>(() => readSort(initialParams));
  const [page, setPage] = useState(() => readPage(initialParams));
  const [pageSize, setPageSize] = useState<PageSize>(() => readPageSize(initialParams));

  // Row → detail Sheet state (F3). `activeRow` remains set while the Sheet
  // closes so the exit animation renders content. Focus restore is handled
  // by stashing the trigger element and restoring in onOpenChange.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<AllRidersRow | null>(null);
  const lastTriggerRef = useRef<HTMLTableRowElement | null>(null);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      // Restore focus to the row that opened the Sheet (a11y contract).
      const el = lastTriggerRef.current;
      if (el && typeof el.focus === "function") {
        // Defer to after Radix' own focus dance completes.
        queueMicrotask(() => el.focus());
      }
    }
  }, []);

  const openRow = useCallback((row: AllRidersRow, trigger: HTMLTableRowElement) => {
    lastTriggerRef.current = trigger;
    setActiveRow(row);
    setSheetOpen(true);
  }, []);

  // Reset page 1 whenever filters/search/tab/pageSize change.
  useEffect(() => {
    setPage(1);
  }, [statusTab, debouncedSearch, pageSize]);

  // Sync state → URL. Defaults omitted so shared links stay minimal.
  useEffect(() => {
    const next = new URLSearchParams();
    if (statusTab !== "all") next.set("status", statusTab);
    const q = debouncedSearch.trim();
    if (q !== "") next.set("q", q);
    if (sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) {
      next.set("sort", sort.key);
      next.set("dir", sort.dir);
    }
    if (page !== 1) next.set("page", String(page));
    if (pageSize !== DEFAULT_PAGE_SIZE) next.set("pageSize", String(pageSize));
    // Only write if something changed — avoids replace-history churn.
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // We intentionally omit searchParams from deps: it's re-derived here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab, debouncedSearch, sort.key, sort.dir, page, pageSize, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    (async () => {
      try {
        const res = await fetch(API_GET_ALL_RIDERS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || res.statusText || "NO RESPONSE");
        }
        const data = (await res.json()) as WireResponse;
        if (!data || !Array.isArray(data.riders)) {
          throw new Error("Invalid response shape");
        }
        if (cancelled) return;
        setRows(mapAllRidersResponse(data.riders));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load riders");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const total = rows?.length ?? 0;

  // Counts per status tab — computed once per data change; ignores search.
  const counts = useMemo(() => {
    const c: Record<StatusTab, number> = {
      all: 0,
      active: 0,
      pending: 0,
      blocked: 0,
      offboarded: 0,
    };
    if (!rows) return c;
    c.all = rows.length;
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  // Post-filter, pre-slice rows — used by table AND CSV export.
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    const q = debouncedSearch.trim().toLowerCase();
    let out = statusTab === "all" ? rows : rows.filter((r) => r.status === statusTab);
    if (q !== "") {
      out = out.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.cnic.toLowerCase().includes(q),
      );
    }
    // Copy before sort to avoid mutating memoized upstream ref.
    return [...out].sort((a, b) => compare(a, b, sort.key, sort.dir));
  }, [rows, statusTab, debouncedSearch, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(pageStart, pageStart + pageSize);

  const toggleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      // 3rd click on same column → back to default sort.
      return DEFAULT_SORT;
    });
  }, []);

  const ariaSortFor = (key: SortKey): "ascending" | "descending" | "none" => {
    if (sort.key !== key) return "none";
    return sort.dir === "asc" ? "ascending" : "descending";
  };

  const handleClearFilters = () => {
    setStatusTab("all");
    setSearchInput("");
  };

  const handleExport = () => {
    const csv = ridersToCsv(filteredRows);
    downloadCsv(csv, csvFilename(statusTab));
  };

  const handleRowKeyDown = (
    e: ReactKeyboardEvent<HTMLTableRowElement>,
    row: AllRidersRow,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openRow(row, e.currentTarget);
    }
  };

  const loading = rows === null && error === null;
  const empty = rows !== null && filteredRows.length === 0;

  // Post-debounce announcement for AT users. `role=status`+`aria-live=polite`
  // on the visible summary paragraph fired on every keystroke (E3). Instead
  // we render a `sr-only` live region that mirrors the settled summary; the
  // visible paragraph is plain text. Announcement text only changes when the
  // *debounced* filter set changes — no per-keystroke chatter.
  const summaryText = `Showing ${pageStart + 1}–${Math.min(pageStart + pageSize, filteredRows.length)} of ${filteredRows.length} riders${filteredRows.length !== total ? ` (filtered from ${total})` : ""}`;

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <header className="w-full flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} label="Dashboard" />
          <Logo size="sm" />
        </div>
        <Badge
          variant="outline"
          className="rounded-full px-3 py-1.5 text-xs font-semibold"
        >
          {total} total
        </Badge>
      </header>

      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1 text-foreground">All Riders</h1>
        <p className="text-sm mb-6 text-muted-foreground">
          Search, filter, and export the full rider roster.
        </p>

        {/* Toolbar: status tabs + search + export */}
        <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
          <div
            role="tablist"
            aria-label="Filter by status"
            className="flex flex-wrap gap-1 bg-muted rounded-lg p-1"
          >
            {STATUS_TABS.map((t) => {
              const selected = statusTab === t;
              return (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => setStatusTab(t)}
                  className={
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors " +
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 " +
                    (selected
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {TAB_LABEL[t]}
                  <span
                    className="ml-2 inline-flex items-center justify-center rounded-full bg-background px-1.5 text-xs font-semibold text-muted-foreground"
                    data-testid={`fqa-count-${t}`}
                  >
                    {counts[t]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="fqa-search" className="sr-only">
              Search riders
            </Label>
            <Input
              id="fqa-search"
              type="search"
              placeholder="Search by name, phone, or CNIC…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-full md:w-72 rounded-xl px-3 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredRows.length === 0}
              aria-label={`Export CSV (${filteredRows.length} rows)`}
            >
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl border-border overflow-hidden p-0">
          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="px-6 py-10 text-center text-sm text-muted-foreground"
            >
              Loading riders…
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="px-6 py-6 text-sm text-destructive bg-destructive/10 flex items-center justify-between gap-4"
            >
              <span>{error}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReloadKey((k) => k + 1)}
              >
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && empty && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-foreground">
                No riders found
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                Try adjusting your filters or search term.
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleClearFilters}
                className="mt-2"
              >
                Clear filters
              </Button>
            </div>
          )}

          {!loading && !error && !empty && (
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  All riders — sortable, filterable
                </caption>
                {/* Sticky header (F2): position:sticky on <thead>. Bg + border
                    prevent content bleed under the header on scroll. */}
                <thead className="sticky top-0 z-10 bg-muted text-left text-xs font-medium text-muted-foreground uppercase tracking-wider shadow-[inset_0_-1px_0_hsl(var(--border))]">
                  <tr>
                    <SortableTh sortKey="name" ariaSort={ariaSortFor("name")} onSort={toggleSort} minWidth="min-w-[160px]">
                      Name
                    </SortableTh>
                    <SortableTh sortKey="phone" ariaSort={ariaSortFor("phone")} onSort={toggleSort} minWidth="min-w-[130px]">
                      Phone
                    </SortableTh>
                    <SortableTh sortKey="cnic" ariaSort={ariaSortFor("cnic")} onSort={toggleSort} minWidth="min-w-[150px]">
                      CNIC
                    </SortableTh>
                    <SortableTh sortKey="status" ariaSort={ariaSortFor("status")} onSort={toggleSort} minWidth="min-w-[110px]">
                      Status
                    </SortableTh>
                    <SortableTh sortKey="area" ariaSort={ariaSortFor("area")} onSort={toggleSort} minWidth="min-w-[140px]">
                      Area
                    </SortableTh>
                    <SortableTh sortKey="joinedAt" ariaSort={ariaSortFor("joinedAt")} onSort={toggleSort} minWidth="min-w-[100px]">
                      Joined
                    </SortableTh>
                    <th scope="col" className="px-4 py-3 w-[80px] text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageRows.map((r) => (
                    <tr
                      key={r.id}
                      tabIndex={0}
                      aria-label={`Open details for ${r.name || "rider"}`}
                      onClick={(e) => openRow(r, e.currentTarget)}
                      onKeyDown={(e) => handleRowKeyDown(e, r)}
                      className="hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    >
                      <th scope="row" className="px-4 py-3 font-medium text-foreground text-left">
                        {r.name || "—"}
                      </th>
                      <td className="px-4 py-3 font-mono text-xs">{r.phone || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.cnic || "—"}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_BADGE[r.status]}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-current"
                            aria-hidden="true"
                          />
                          {TAB_LABEL[r.status as StatusTab]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{r.area || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatJoined(r.joinedAt)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {/* Row is the trigger now — Sheet holds details. */}
                        —
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {!loading && !error && !empty && (
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Visible summary: plain text, no aria-live (E3 fix). */}
            <p className="text-xs text-muted-foreground">{summaryText}</p>
            {/* Sr-only live region: only updates when the DEBOUNCED filter
                set settles, so screen readers don't announce every keystroke. */}
            <div className="sr-only" aria-live="polite">
              {summaryText}
            </div>

            <div className="flex items-center gap-3">
              <Label htmlFor="fqa-page-size" className="text-xs text-muted-foreground">
                Rows per page:
              </Label>
              <select
                id="fqa-page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                >
                  ‹
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  Page {currentPage} of {pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={currentPage >= pageCount}
                  aria-label="Next page"
                >
                  ›
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <RiderDetailSheet
        row={activeRow}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}

interface SortableThProps {
  sortKey: SortKey;
  ariaSort: "ascending" | "descending" | "none";
  onSort: (key: SortKey) => void;
  minWidth: string;
  children: React.ReactNode;
}

function SortableTh({
  sortKey,
  ariaSort,
  onSort,
  minWidth,
  children,
}: SortableThProps) {
  const indicator =
    ariaSort === "ascending" ? "↑" : ariaSort === "descending" ? "↓" : "↕";
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={`px-4 py-3 ${minWidth}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        {children}
        <span
          aria-hidden="true"
          className={ariaSort === "none" ? "opacity-40" : "text-foreground"}
        >
          {indicator}
        </span>
      </button>
    </th>
  );
}
