import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useSearchParams } from "react-router";
import { getAllRiders } from "@/api/riders";
import type { AllRidersRow, RiderStatus } from "@/types/rider";
import { mapAllRidersResponse } from "@/features/riders/mapper";
import {
  csvFilename,
  downloadCsv,
  ridersToCsv,
} from "@/features/riders/csv";
import { RiderDetailSheet } from "@/features/riders/RiderDetailSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KARACHI_AREAS } from "@/features/riders/constants";
import { useDebounced } from "@/features/riders/useDebounced";

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

function readArea(sp: URLSearchParams): string {
  const v = sp.get("area");
  return v && v !== "" ? v : "all";
}

const AREA_ITEMS = KARACHI_AREAS.map((a) => (
  <SelectItem key={a} value={a}>{a}</SelectItem>
));

export default function AllRiders() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Snapshot the URL parameters at mount and treat local state as the source of
  // truth from then on; a separate effect writes state back to the URL. This
  // preserves refresh and back-button behaviour without a two-way reactive loop.
  const initialParams = useRef(searchParams).current;

  const [rows, setRows] = useState<AllRidersRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [statusTab, setStatusTab] = useState<StatusTab>(() =>
    readStatusTab(initialParams),
  );
  const [searchInput, setSearchInput] = useState(() => initialParams.get("q") ?? "");
  const debouncedSearch = useDebounced(searchInput, 300);
  const [areaFilter, setAreaFilter] = useState<string>(() => readArea(initialParams));
  const [sort, setSort] = useState<SortState>(() => readSort(initialParams));
  const [page, setPage] = useState(() => readPage(initialParams));
  const [pageSize, setPageSize] = useState<PageSize>(() => readPageSize(initialParams));

  // Keep activeRow set while the detail sheet is closing so the exit animation
  // still has content to render. Focus is restored by stashing the trigger row
  // element and calling focus() on it inside onOpenChange.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<AllRidersRow | null>(null);
  const lastTriggerRef = useRef<HTMLTableRowElement | null>(null);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      const el = lastTriggerRef.current;
      if (el && typeof el.focus === "function") {
        // Wait until Radix has finished its own focus handling before restoring
        // focus to the originating row, otherwise Radix overwrites it.
        queueMicrotask(() => el.focus());
      }
    }
  }, []);

  const openRow = useCallback((row: AllRidersRow, trigger: HTMLTableRowElement) => {
    lastTriggerRef.current = trigger;
    setActiveRow(row);
    setSheetOpen(true);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusTab, debouncedSearch, pageSize, areaFilter]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (statusTab !== "all") next.set("status", statusTab);
    const q = debouncedSearch.trim();
    if (q !== "") next.set("q", q);
    if (areaFilter !== "all") next.set("area", areaFilter);
    if (sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) {
      next.set("sort", sort.key);
      next.set("dir", sort.dir);
    }
    if (page !== 1) next.set("page", String(page));
    if (pageSize !== DEFAULT_PAGE_SIZE) next.set("pageSize", String(pageSize));
    // Skip the write when the serialised parameters have not changed so we do
    // not churn the router history with identical replace() calls.
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // searchParams is intentionally omitted: this effect derives it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab, debouncedSearch, areaFilter, sort.key, sort.dir, page, pageSize, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    (async () => {
      try {
        // The API wrapper throws an ApiError on non-ok responses whose
        // message is the server response text verbatim, matching the exact
        // error copy the retry banner rendered before.
        const data = (await getAllRiders()) as WireResponse;
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

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    const q = debouncedSearch.trim().toLowerCase();
    let out = statusTab === "all" ? rows : rows.filter((r) => r.status === statusTab);
    if (areaFilter !== "all") {
      out = out.filter((r) => r.area === areaFilter);
    }
    if (q !== "") {
      out = out.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.cnic.toLowerCase().includes(q),
      );
    }
    // Sort a copy so the memoised upstream array is never mutated in place.
    return [...out].sort((a, b) => compare(a, b, sort.key, sort.dir));
  }, [rows, statusTab, debouncedSearch, areaFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(pageStart, pageStart + pageSize);

  const toggleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      // Third click on the same column returns to the default sort state.
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
    setAreaFilter("all");
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

  // The visible summary paragraph is plain text; the aria-live announcement is
  // rendered separately as a screen-reader-only region that mirrors the settled
  // summary. Because summaryText is derived from the debounced search value, the
  // live region only updates once the user stops typing, avoiding per-keystroke
  // chatter for assistive-technology users.
  const summaryText = `Showing ${pageStart + 1}–${Math.min(pageStart + pageSize, filteredRows.length)} of ${filteredRows.length} riders${filteredRows.length !== total ? ` (filtered from ${total})` : ""}`;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full md:w-72">
              <Label htmlFor="fqa-search" className="sr-only">
                Search riders
              </Label>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
              <Input
                id="fqa-search"
                type="search"
                placeholder="Search by name, phone, or CNIC…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-9 w-full rounded-lg pl-9 pr-3 text-sm bg-card"
              />
            </div>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger
                id="fqa-area"
                aria-label="Filter by area"
                className="h-9 w-full md:w-52 rounded-lg border border-input bg-card px-3 text-sm"
              >
                <SelectValue placeholder="All areas" />
              </SelectTrigger>
              <SelectContent className="duration-0">
                <SelectItem value="all">All areas</SelectItem>
                {AREA_ITEMS}
              </SelectContent>
            </Select>
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
                {/* Explicit background and inset border on the sticky header keep
                    scrolling row content from bleeding through underneath it. */}
                <thead className="sticky top-0 z-10 bg-switch-background text-left text-[11px] font-semibold text-foreground/70 uppercase tracking-wider shadow-[inset_0_-1px_0_hsl(var(--border))]">
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
                    <th scope="col" className="pl-4 pr-6 py-3 w-[80px] text-center">
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
                      className="h-12 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                    >
                      <th scope="row" className="pl-6 pr-4 py-3 font-medium text-foreground text-left">
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
                      <td className="pl-4 pr-6 py-3 text-center text-xs text-muted-foreground">
                        —
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && !empty && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">{summaryText}</p>
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

                {pageCount > 1 && (
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
                )}
              </div>
            </div>
          )}
        </Card>
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
      className={`${sortKey === "name" ? "pl-6 pr-4" : "px-4"} py-3 ${minWidth}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
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
