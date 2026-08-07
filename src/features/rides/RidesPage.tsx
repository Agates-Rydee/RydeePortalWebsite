import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  getRides,
  LIVE_POLL_MS,
  type Ride,
  type RideTab,
  type RidesCounts,
} from "@/api/rides";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useDebounced } from "@/features/riders/useDebounced";
import { RidesTable } from "./components/RidesTable";
import { ARRIVED_RETENTION_MS } from "./components/RidesTable.helpers";

const TABS: readonly RideTab[] = ["live", "upcoming", "completed", "canceled"];
const PAGE_SIZES = [10, 25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];

import type { RideSortDir, RideSortKey } from "@/api/rides";
type SortKey = RideSortKey;
type SortDir = RideSortDir;
interface SortState {
  key: SortKey;
  dir: SortDir;
}
const DEFAULT_SORT: SortState = { key: "rideId", dir: "asc" };
const COMMON_KEYS: readonly SortKey[] = [
  "rideId",
  "riderName",
  "customerName",
  "pickupLabel",
  "dropoffLabel",
  "status",
  "fareAmount",
];
const TAB_KEYS: Record<RideTab, readonly SortKey[]> = {
  live: ["startedAt"],
  upcoming: ["scheduledAt"],
  completed: ["completedAt", "duration"],
  canceled: ["canceledAt", "canceledBy"],
};

function validKeysFor(tab: RideTab): readonly SortKey[] {
  return [...COMMON_KEYS, ...TAB_KEYS[tab]];
}

function readTab(sp: URLSearchParams): RideTab {
  const v = sp.get("tab");
  return (TABS as readonly string[]).includes(v ?? "") ? (v as RideTab) : "live";
}

function readPage(sp: URLSearchParams): number {
  const n = Number(sp.get("page"));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function readPageSize(sp: URLSearchParams, def: PageSize): PageSize {
  const n = Number(sp.get("pageSize"));
  return (PAGE_SIZES as readonly number[]).includes(n) ? (n as PageSize) : def;
}

function readSort(sp: URLSearchParams, tab: RideTab): SortState {
  const key = sp.get("sort");
  const dir = sp.get("dir");
  const valid = validKeysFor(tab);
  const validKey = (valid as readonly string[]).includes(key ?? "");
  const validDir = dir === "asc" || dir === "desc";
  if (!validKey || !validDir) return DEFAULT_SORT;
  return { key: key as SortKey, dir: dir as SortDir };
}

function tsOrNaN(iso: string | undefined): number {
  if (!iso) return Number.NaN;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? Number.NaN : t;
}

function cmpStr(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function cmpNum(a: number, b: number): number {
  const aNaN = Number.isNaN(a);
  const bNaN = Number.isNaN(b);
  if (aNaN && bNaN) return 0;
  if (aNaN) return 1;
  if (bNaN) return -1;
  return a - b;
}

function compare(a: Ride, b: Ride, key: SortKey, dir: SortDir): number {
  let c = 0;
  switch (key) {
    case "rideId": c = cmpStr(a.rideId, b.rideId); break;
    case "riderName": c = cmpStr(a.rider.name, b.rider.name); break;
    case "customerName": c = cmpStr(a.customer.name, b.customer.name); break;
    case "pickupLabel": c = cmpStr(a.pickup.label, b.pickup.label); break;
    case "dropoffLabel": c = cmpStr(a.dropoff.label, b.dropoff.label); break;
    case "status": c = cmpStr(a.status, b.status); break;
    case "fareAmount": c = cmpNum(a.fare?.amount ?? Number.NaN, b.fare?.amount ?? Number.NaN); break;
    case "startedAt": c = cmpNum(tsOrNaN(a.startedAt), tsOrNaN(b.startedAt)); break;
    case "scheduledAt": c = cmpNum(tsOrNaN(a.scheduledAt), tsOrNaN(b.scheduledAt)); break;
    case "completedAt": c = cmpNum(tsOrNaN(a.completedAt), tsOrNaN(b.completedAt)); break;
    case "duration": {
      const av = tsOrNaN(a.completedAt) - tsOrNaN(a.startedAt);
      const bv = tsOrNaN(b.completedAt) - tsOrNaN(b.startedAt);
      c = cmpNum(av, bv);
      break;
    }
    case "canceledAt": c = cmpNum(tsOrNaN(a.canceledAt), tsOrNaN(b.canceledAt)); break;
    case "canceledBy": c = cmpStr(a.canceledBy ?? "", b.canceledBy ?? ""); break;
  }
  if (c === 0) c = cmpStr(a.rideId, b.rideId);
  return dir === "asc" ? c : -c;
}

export default function RidesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialParams = useRef(searchParams).current;

  const [tab, setTab] = useState<RideTab>(() => readTab(initialParams));
  const [searchInput, setSearchInput] = useState(() => initialParams.get("q") ?? "");
  const debouncedSearch = useDebounced(searchInput, 300);
  const initDefault: PageSize =
    readTab(initialParams) === "live" || readTab(initialParams) === "upcoming" ? 10 : 25;
  const [page, setPage] = useState(() => readPage(initialParams));
  const [pageSize, setPageSize] = useState<PageSize>(() =>
    readPageSize(initialParams, initDefault),
  );
  const [sort, setSort] = useState<SortState>(() => readSort(initialParams, readTab(initialParams)));

  const [rides, setRides] = useState<Ride[] | null>(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<RidesCounts>({
    live: 0,
    upcoming: 0,
    completed: 0,
    canceled: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const arrivedFirstSeen = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, pageSize]);

  useEffect(() => {
    const valid = validKeysFor(tab);
    if (!(valid as readonly string[]).includes(sort.key)) {
      setSort(DEFAULT_SORT);
    }
  }, [tab, sort.key]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (tab !== "live") next.set("tab", tab);
    const q = debouncedSearch.trim();
    if (q !== "") next.set("q", q);
    if (page !== 1) next.set("page", String(page));
    const defSize: PageSize = tab === "live" || tab === "upcoming" ? 10 : 25;
    if (pageSize !== defSize) next.set("pageSize", String(pageSize));
    if (sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) {
      next.set("sort", sort.key);
      next.set("dir", sort.dir);
    }
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debouncedSearch, page, pageSize, sort.key, sort.dir, setSearchParams]);

  useEffect(() => {
    let cancelled = false;
    const isServerPaged = tab === "completed" || tab === "canceled";
    const fetchOnce = async () => {
      try {
        const req = isServerPaged
          ? { tab, page, pageSize, sortBy: sort.key, sortDir: sort.dir }
          : { tab };
        const data = await getRides(req);
        if (cancelled) return;
        setRides(data.rides);
        setTotal(data.total);
        setCounts(data.counts);
        setError(null);
        setUnavailable(false);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "";
        const status = (err as { status?: number } | null)?.status;
        if (status === 404 || status === 0 || status === undefined) {
          setUnavailable(true);
          setRides([]);
        } else {
          setError(msg || t("rides.errors.loadFailed"));
        }
      }
    };
    void fetchOnce();
    if (tab === "live") {
      const id = window.setInterval(fetchOnce, LIVE_POLL_MS);
      return () => {
        cancelled = true;
        window.clearInterval(id);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [tab, page, pageSize, reloadKey, t, sort.key, sort.dir]);

  const now = nowTick;

  const visibleRides = useMemo(() => {
    if (!rides) return [];
    let out = rides;
    if (tab === "live") {
      const seen = arrivedFirstSeen.current;
      const currentIds = new Set(out.map((r) => r.rideId));
      for (const key of Array.from(seen.keys())) {
        if (!currentIds.has(key)) seen.delete(key);
      }
      out = out.filter((r) => {
        if (r.status !== "arrived") {
          seen.delete(r.rideId);
          return true;
        }
        const first = seen.get(r.rideId) ?? now;
        if (!seen.has(r.rideId)) seen.set(r.rideId, first);
        return now - first < ARRIVED_RETENTION_MS;
      });
    }
    const q = debouncedSearch.trim().toLowerCase();
    if (q !== "") {
      out = out.filter(
        (r) =>
          r.rideId.toLowerCase().includes(q) ||
          r.rider.name.toLowerCase().includes(q) ||
          r.rider.phone.toLowerCase().includes(q) ||
          r.customer.name.toLowerCase().includes(q) ||
          r.customer.phone.toLowerCase().includes(q) ||
          r.pickup.label.toLowerCase().includes(q) ||
          r.dropoff.label.toLowerCase().includes(q),
      );
    }
    if (tab === "completed" || tab === "canceled") return out;
    return [...out].sort((a, b) => compare(a, b, sort.key, sort.dir));
  }, [rides, tab, debouncedSearch, now, sort.key, sort.dir]);

  const isServerPaged = tab === "completed" || tab === "canceled";
  const pageCount = isServerPaged
    ? Math.max(1, Math.ceil(total / pageSize))
    : Math.max(1, Math.ceil(visibleRides.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = isServerPaged
    ? visibleRides
    : visibleRides.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loading = rides === null && error === null && !unavailable;
  const empty = rides !== null && !unavailable && visibleRides.length === 0;

  const totalForSummary = isServerPaged ? total : visibleRides.length;
  const fromIdx = totalForSummary === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toIdx = isServerPaged
    ? Math.min(currentPage * pageSize, total)
    : Math.min(currentPage * pageSize, visibleRides.length);
  const summaryText = t("rides.summary", { from: fromIdx, to: toIdx, count: totalForSummary });

  const toggleSort = useCallback((key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return DEFAULT_SORT;
    });
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          role="tablist"
          aria-label={t("rides.filterByStatus")}
          className="flex flex-wrap gap-1 bg-muted rounded-lg p-1"
        >
          {TABS.map((tName) => {
            const selected = tab === tName;
            return (
              <button
                key={tName}
                role="tab"
                type="button"
                aria-selected={selected}
                onClick={() => setTab(tName)}
                className={
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors " +
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 " +
                  (selected
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {t(`rides.tabs.${tName}`)}
                <span
                  className="ms-2 inline-flex items-center justify-center rounded-full bg-background px-1.5 text-xs font-semibold text-muted-foreground"
                  data-testid={`fqa-rides-count-${tName}`}
                >
                  {counts[tName]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-72">
          <Label htmlFor="fqa-rides-search" className="sr-only">
            {t("rides.search.label")}
          </Label>
          <Search
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70"
            aria-hidden="true"
          />
          <Input
            id="fqa-rides-search"
            type="search"
            placeholder={t("rides.search.placeholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-full rounded-lg ps-9 pe-3 text-sm bg-card"
          />
        </div>
      </div>

      <Card className="rounded-2xl border-border overflow-hidden p-0">
        {loading && (
          <div role="status" className="px-6 py-10 text-center text-sm text-muted-foreground">
            {t("rides.loading")}
          </div>
        )}

        {error && !loading && (
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
              {t("rides.retry")}
            </Button>
          </div>
        )}

        {unavailable && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">{t("rides.unavailableTitle")}</p>
            <p className="text-xs mt-1 text-muted-foreground">{t("rides.unavailableHint")}</p>
          </div>
        )}

        {!loading && !error && !unavailable && empty && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">{t(`rides.empty.${tab}`)}</p>
          </div>
        )}

        {!loading && !error && !unavailable && !empty && (
          <>
            <div className="max-h-[70vh] overflow-y-auto">
              <RidesTable
                rides={pageRows}
                tab={tab}
                now={now}
                caption={t(`rides.caption.${tab}`)}
                sort={sort}
                onSort={toggleSort}
                arrivedFirstSeen={arrivedFirstSeen.current}
              />
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">{summaryText}</p>
              <div className="sr-only" aria-live="polite">
                {t("rides.liveCount", { count: counts.live })}
              </div>

              <div className="flex items-center gap-3">
                <Label htmlFor="fqa-rides-page-size" className="text-xs text-muted-foreground">
                  {t("rides.rowsPerPage")}
                </Label>
                <select
                  id="fqa-rides-page-size"
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
                    aria-label={t("rides.prevPage")}
                  >
                    ‹
                  </Button>
                  <span className="text-xs text-muted-foreground px-2">
                    {t("rides.page", { cur: currentPage, total: pageCount })}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={currentPage >= pageCount}
                    aria-label={t("rides.nextPage")}
                  >
                    ›
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
