import { useCallback, useState, useEffect, useMemo, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Search } from "lucide-react";
import { getUnregisteredRiders } from "@/api/riders";
import type { PendingRider } from "@/types/rider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RiderProfileCard,
  BlockRiderAction,
} from "@/features/riders/RiderProfileCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KARACHI_AREAS } from "@/features/riders/constants";
import { useDebounced } from "@/features/riders/useDebounced";

const AREA_ITEMS = KARACHI_AREAS.map((a) => (
  <SelectItem key={a} value={a}>{a}</SelectItem>
));

interface UnregisteredRidersResponse {
  riders?: Array<Record<string, unknown>>;
}

const PAGE_SIZES = [10, 25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];
const DEFAULT_PAGE_SIZE: PageSize = 10;

type SortKey = "name" | "phone" | "cnic" | "status";
type SortDir = "asc" | "desc";
interface SortState { key: SortKey; dir: SortDir }
const DEFAULT_SORT: SortState = { key: "name", dir: "asc" };

function compare(a: PendingRider, b: PendingRider, key: SortKey, dir: SortDir): number {
  const av = key === "status" ? "pending" : (a[key] ?? "");
  const bv = key === "status" ? "pending" : (b[key] ?? "");
  const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}

function toPendingRider(raw: Record<string, unknown>, idx: number): PendingRider {
  const id = typeof raw.id === "number" ? raw.id : idx + 1;
  const documents = Array.isArray(raw.documents)
    ? (raw.documents as unknown[]).filter((d): d is string => typeof d === "string")
    : [];
  return {
    id,
    name: typeof raw.name === "string" ? raw.name : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    dob: typeof raw.dob === "string" ? raw.dob : "",
    cnic: typeof raw.cnic === "string" ? raw.cnic : "",
    area:
      typeof raw.area === "string"
        ? raw.area
        : typeof raw.rideArea === "string"
          ? raw.rideArea
          : "",
    documents,
    pin: typeof raw.pin === "string" ? raw.pin : "",
  };
}

function isPending(raw: Record<string, unknown>): boolean {
  const rawStatus = raw.activation_status ?? raw.activationStatus;
  const status = String(rawStatus ?? "").toLowerCase().trim();
  if (status !== "") return status === "pending";
  if (raw.activated === true) return false;
  return true;
}

export default function PendingRiders() {
  const [riders, setRiders] = useState<PendingRider[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<PendingRider | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [searchInput, setSearchInput] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const debouncedSearch = useDebounced(searchInput, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, areaFilter, pageSize, sort]);

  const toggleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return DEFAULT_SORT;
    });
  }, []);

  const ariaSortFor = (key: SortKey): "ascending" | "descending" | "none" => {
    if (sort.key !== key) return "none";
    return sort.dir === "asc" ? "ascending" : "descending";
  };

  const filteredRiders = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const out = riders.filter((r) => {
      if (areaFilter !== "all" && r.area !== areaFilter) return false;
      if (q === "") return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.cnic.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q)
      );
    });
    return [...out].sort((a, b) => compare(a, b, sort.key, sort.dir));
  }, [riders, debouncedSearch, areaFilter, sort]);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const data = (await getUnregisteredRiders()) as UnregisteredRidersResponse;
        if (!data || !Array.isArray(data.riders)) {
          throw new Error("Invalid response shape");
        }
        const pending = data.riders.filter(isPending).map((r, i) => toPendingRider(r, i));
        if (cancelled) return;
        setRiders(pending);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load riders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2000);
    return () => clearTimeout(t);
  }, [notice]);

  const selectRider = (id: number) => {
    const rider = riders.find((r) => r.id === id) ?? null;
    setSelectedId(id);
    setForm(rider ? { ...rider } : null);
  };

  const handleRowKeyDown = (
    e: ReactKeyboardEvent<HTMLTableRowElement>,
    id: number,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectRider(id);
    }
  };

  const confirmBlock = () => {
    if (!form) return;
    setRiders((r) => r.filter((x) => x.id !== form.id));
    setSelectedId(null);
    setForm(null);
    setNotice("Rider blocked");
  };

  const handleSave = () => {
    if (!form) return;
    setRiders((r) => r.map((x) => (x.id === form.id ? { ...form } : x)));
    setNotice("Changes saved");
  };

  const pageCount = Math.max(1, Math.ceil(filteredRiders.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = filteredRiders.slice(pageStart, pageStart + pageSize);
  const noMatches = riders.length > 0 && filteredRiders.length === 0;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground"
        >
          Loading pending riders…
        </div>
      )}

      {!loading && loadError && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/25 bg-destructive/10 px-6 py-6 text-sm text-destructive"
        >
          {loadError}
        </div>
      )}

      {!loading && !loadError && riders.length === 0 && (
        <Card className="rounded-2xl p-10 flex-col items-center justify-center text-center border-border shadow-none">
          <p className="text-sm font-medium text-foreground">No pending riders</p>
          <p className="text-xs mt-1 text-muted-foreground">
            All rider applications have been reviewed.
          </p>
        </Card>
      )}

      {!loading && !loadError && riders.length > 0 && (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full max-w-sm">
                <Label htmlFor="pending-search" className="sr-only">
                  Search pending riders
                </Label>
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
                <Input
                  id="pending-search"
                  type="search"
                  placeholder="Search by name, phone, CNIC, or area…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-9 w-full rounded-lg pl-9 pr-3 text-sm bg-card"
                />
              </div>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger
                  id="pending-area"
                  aria-label="Filter by area"
                  className="h-9 w-full max-w-[16rem] rounded-lg border border-input bg-card px-3 text-sm"
                >
                  <SelectValue placeholder="All areas" />
                </SelectTrigger>
                <SelectContent className="duration-0">
                  <SelectItem value="all">All areas</SelectItem>
                  {AREA_ITEMS}
                </SelectContent>
              </Select>
            </div>
            <Card className="rounded-2xl border-border overflow-hidden p-0">
              {noMatches ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-foreground">No matches</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    No pending riders match “{debouncedSearch}”.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm table-fixed">
                    <caption className="sr-only">Pending riders</caption>
                    <thead className="bg-switch-background text-left text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
                      <tr>
                        <SortableTh sortKey="name" ariaSort={ariaSortFor("name")} onSort={toggleSort} className="pl-6 pr-4 py-3 w-[32%]">Name</SortableTh>
                        <SortableTh sortKey="phone" ariaSort={ariaSortFor("phone")} onSort={toggleSort} className="px-4 py-3 w-[22%]">Phone</SortableTh>
                        <SortableTh sortKey="cnic" ariaSort={ariaSortFor("cnic")} onSort={toggleSort} className="px-4 py-3 w-[26%]">CNIC</SortableTh>
                        <SortableTh sortKey="status" ariaSort={ariaSortFor("status")} onSort={toggleSort} className="pl-4 pr-6 py-3 w-[20%]" align="right">Status</SortableTh>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pageRows.map((r) => {
                        const selected = r.id === selectedId;
                        return (
                          <tr
                            key={r.id}
                            tabIndex={0}
                            role="button"
                            aria-pressed={selected}
                            aria-label={`Review application for ${r.name || "rider"}`}
                            onClick={() => selectRider(r.id)}
                            onKeyDown={(e) => handleRowKeyDown(e, r.id)}
                            className={
                              "h-12 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                              (selected ? "bg-muted/50 shadow-sm" : "hover:bg-muted/30")
                            }
                          >
                            <th scope="row" className="pl-6 pr-4 py-3 font-medium text-foreground text-left">
                              {r.name || "—"}
                            </th>
                            <td className="px-4 py-3 font-mono text-xs">{r.phone || "—"}</td>
                            <td className="px-4 py-3 font-mono text-xs">{r.cnic || "—"}</td>
                            <td className="pl-4 pr-6 py-3 text-right">
                              <Badge
                                variant="outline"
                                className="gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-warning-muted text-warning border-warning/25"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                                Pending
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!noMatches && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-border bg-muted/30 px-4 py-3 text-xs">
                  <p className="text-muted-foreground">
                    Showing {pageStart + 1}–{Math.min(pageStart + pageSize, filteredRiders.length)} of {filteredRiders.length} riders
                  </p>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="pending-page-size" className="text-xs text-muted-foreground">
                      Rows per page:
                    </Label>
                    <select
                      id="pending-page-size"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>{n}</option>
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
                      <span className="text-muted-foreground px-2">
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
            </Card>
          </div>

          <div>
            {form ? (
              <RiderProfileCard
                form={form}
                onChange={setForm}
                onSave={handleSave}
                actions={<BlockRiderAction riderName={form.name} onConfirm={confirmBlock} />}
              />
            ) : (
              <Card className="rounded-2xl p-10 flex-col items-center justify-center text-center border-border shadow-none">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-warning-muted">
                  <svg
                    width="26" height="26" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    className="text-warning" aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">No rider selected</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Choose a rider from the table to review their application.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-md border bg-success-muted text-success border-success/25 px-4 py-2 text-sm font-medium shadow-md"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

interface SortableThProps {
  sortKey: SortKey;
  ariaSort: "ascending" | "descending" | "none";
  onSort: (key: SortKey) => void;
  className: string;
  align?: "left" | "right";
  children: React.ReactNode;
}

function SortableTh({ sortKey, ariaSort, onSort, className, align = "left", children }: SortableThProps) {
  const indicator = ariaSort === "ascending" ? "↑" : ariaSort === "descending" ? "↓" : "↕";
  return (
    <th scope="col" aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={
          "inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded " +
          (align === "right" ? "ml-auto" : "")
        }
      >
        {children}
        <span aria-hidden="true" className={ariaSort === "none" ? "opacity-40" : "text-foreground"}>
          {indicator}
        </span>
      </button>
    </th>
  );
}
