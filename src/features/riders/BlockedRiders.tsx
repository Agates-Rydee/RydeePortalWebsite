import {
  useCallback,
  useState,
  useEffect,
  useMemo,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { getAllRiders, updateUser } from "@/api/riders";
import { mapAllRidersResponse } from "@/features/riders/mapper";
import type { AllRidersRow, PendingRider } from "@/types/rider";
import { formatCnic, normalizeCnicInput } from "@/features/riders/cnic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RiderProfileCard } from "@/features/riders/RiderProfileCard";
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
  <SelectItem key={a} value={a}>
    {a}
  </SelectItem>
));

interface WireResponse {
  riders?: Array<Record<string, unknown>>;
}

const PAGE_SIZES = [10, 25, 50, 100] as const;
type PageSize = (typeof PAGE_SIZES)[number];
const DEFAULT_PAGE_SIZE: PageSize = 10;

type SortKey = "name" | "phone" | "cnic" | "status";
type SortDir = "asc" | "desc";
interface SortState {
  key: SortKey;
  dir: SortDir;
}
const DEFAULT_SORT: SortState = { key: "name", dir: "asc" };

function compare(a: PendingRider, b: PendingRider, key: SortKey, dir: SortDir): number {
  const av = key === "status" ? "blocked" : (a[key] ?? "");
  const bv = key === "status" ? "blocked" : (b[key] ?? "");
  const cmp = String(av).localeCompare(String(bv), undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return dir === "asc" ? cmp : -cmp;
}

function toProfileForm(row: AllRidersRow): PendingRider {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    dob: row.dob ?? "",
    cnic: row.cnic,
    area: row.area,
    documents: row.documents ?? [],
    pin: row.pin ?? "",
  };
}

interface UnblockActionProps {
  riderName: string;
  onConfirm: () => void;
}

function UnblockAction({ riderName, onConfirm }: UnblockActionProps) {
  const { t } = useTranslation();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-xl px-5 py-3 h-auto text-sm font-semibold bg-success-muted text-success border-success/25 hover:bg-success-muted/80 hover:text-success"
        >
          {t("riders.blocked.unblock")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("riders.blocked.unblockDialog.title", { name: riderName })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("riders.blocked.unblockDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("riders.common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t("riders.blocked.unblockDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function BlockedRiders() {
  const { t } = useTranslation();
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
    (async () => {
      try {
        const data = (await getAllRiders()) as WireResponse;
        if (!data || !Array.isArray(data.riders)) {
          throw new Error(t("riders.errors.invalidResponse"));
        }
        const blocked = mapAllRidersResponse(data.riders)
          .filter((r) => r.status === "blocked")
          .map(toProfileForm);
        if (cancelled) return;
        setRiders(blocked);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : t("riders.errors.loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

  const selectRider = (id: number) => {
    const rider = riders.find((r) => r.id === id) ?? null;
    setSelectedId(id);
    setForm(rider ? { ...rider } : null);
  };

  const handleRowKeyDown = (e: ReactKeyboardEvent<HTMLTableRowElement>, id: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectRider(id);
    }
  };

  const confirmUnblock = () => {
    if (!form) return;
    setRiders((r) => r.filter((x) => x.id !== form.id));
    setSelectedId(null);
    setForm(null);
    setNotice(t("riders.blocked.noticeUnblocked"));
  };

  const handleSave = async () => {
    if (!form) return;
    const original = riders.find((x) => x.id === form.id);
    if (!original) return;
    const patch: Record<string, unknown> = {};
    (Object.keys(form) as Array<keyof PendingRider>).forEach((k) => {
      if (k === "id" || k === "phone") return;
      const a = form[k];
      const b = original[k];
      if (k === "cnic") {
        if (normalizeCnicInput(String(a)) !== normalizeCnicInput(String(b))) patch[k] = a;
        return;
      }
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length || a.some((v, i) => v !== b[i])) patch[k] = a;
      } else if (a !== b) {
        patch[k] = a;
      }
    });
    if (Object.keys(patch).length === 0) {
      setNotice(t("riders.pending.noticeSaved"));
      return;
    }
    try {
      await updateUser(form.phone, "rider", patch);
      setRiders((r) => r.map((x) => (x.id === form.id ? { ...form } : x)));
      setNotice(t("riders.pending.noticeSaved"));
    } catch {
      setNotice(t("riders.pending.noticeSaveFailed"));
    }
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
          {t("riders.blocked.loading")}
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
          <p className="text-sm font-medium text-foreground">{t("riders.blocked.emptyTitle")}</p>
          <p className="text-xs mt-1 text-muted-foreground">{t("riders.blocked.emptyHint")}</p>
        </Card>
      )}

      {!loading && !loadError && riders.length > 0 && (
        <div className="grid gap-4 md:gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full max-w-sm">
                <Label htmlFor="blocked-search" className="sr-only">
                  {t("riders.blocked.searchSr")}
                </Label>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70"
                  aria-hidden="true"
                />
                <Input
                  id="blocked-search"
                  type="search"
                  placeholder={t("riders.blocked.searchPlaceholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-9 w-full rounded-lg pl-9 pr-3 text-sm bg-card"
                />
              </div>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger
                  id="blocked-area"
                  aria-label={t("riders.common.filterByArea")}
                  className="h-9 w-full max-w-[16rem] rounded-lg border border-input bg-card px-3 text-sm"
                >
                  <SelectValue placeholder={t("riders.common.allAreas")} />
                </SelectTrigger>
                <SelectContent className="duration-0">
                  <SelectItem value="all">{t("riders.common.allAreas")}</SelectItem>
                  {AREA_ITEMS}
                </SelectContent>
              </Select>
            </div>
            <Card className="rounded-2xl border-border overflow-hidden p-0">
              {noMatches ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {t("riders.blocked.noMatchesTitle")}
                  </p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {t("riders.blocked.noMatchesHint", { q: debouncedSearch })}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm table-fixed">
                    <caption className="sr-only">{t("riders.blocked.caption")}</caption>
                    <thead className="bg-switch-background text-left text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
                      <tr>
                        <SortableTh
                          sortKey="name"
                          ariaSort={ariaSortFor("name")}
                          onSort={toggleSort}
                          className="pl-6 pr-4 py-3 w-[32%]"
                        >
                          {t("riders.common.columns.name")}
                        </SortableTh>
                        <SortableTh
                          sortKey="phone"
                          ariaSort={ariaSortFor("phone")}
                          onSort={toggleSort}
                          className="px-4 py-3 w-[22%]"
                        >
                          {t("riders.common.columns.phone")}
                        </SortableTh>
                        <SortableTh
                          sortKey="cnic"
                          ariaSort={ariaSortFor("cnic")}
                          onSort={toggleSort}
                          className="px-4 py-3 w-[26%]"
                        >
                          {t("riders.common.columns.cnic")}
                        </SortableTh>
                        <SortableTh
                          sortKey="status"
                          ariaSort={ariaSortFor("status")}
                          onSort={toggleSort}
                          className="pl-4 pr-6 py-3 w-[20%]"
                          align="right"
                        >
                          {t("riders.common.columns.status")}
                        </SortableTh>
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
                            aria-label={t("riders.blocked.rowReviewAria", {
                              name: r.name || "rider",
                            })}
                            onClick={() => selectRider(r.id)}
                            onKeyDown={(e) => handleRowKeyDown(e, r.id)}
                            className={
                              "h-12 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                              (selected ? "bg-muted/50 shadow-sm" : "hover:bg-muted/30")
                            }
                          >
                            <th
                              scope="row"
                              className="pl-6 pr-4 py-3 font-medium text-foreground text-left"
                            >
                              {r.name || "—"}
                            </th>
                            <td className="px-4 py-3 font-mono text-xs">{r.phone || "—"}</td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {r.cnic ? formatCnic(r.cnic) : "—"}
                            </td>
                            <td className="pl-4 pr-6 py-3 text-right">
                              <Badge
                                variant="outline"
                                className="gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-destructive/10 text-destructive border-destructive/25"
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-current"
                                  aria-hidden="true"
                                />
                                {t("riders.common.badges.blocked")}
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
                    {t("riders.common.summary", {
                      from: pageStart + 1,
                      to: Math.min(pageStart + pageSize, filteredRiders.length),
                      count: filteredRiders.length,
                    })}
                  </p>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="blocked-page-size" className="text-xs text-muted-foreground">
                      {t("riders.common.rowsPerPage")}
                    </Label>
                    <select
                      id="blocked-page-size"
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
                        aria-label={t("riders.common.prevPage")}
                      >
                        ‹
                      </Button>
                      <span className="text-muted-foreground px-2">
                        {t("riders.common.page", { cur: currentPage, total: pageCount })}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        disabled={currentPage >= pageCount}
                        aria-label={t("riders.common.nextPage")}
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
                actions={<UnblockAction riderName={form.name} onConfirm={confirmUnblock} />}
              />
            ) : (
              <Card className="rounded-2xl p-10 flex-col items-center justify-center text-center border-border shadow-none">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-destructive/10">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-destructive"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t("riders.blocked.noSelectedTitle")}
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {t("riders.blocked.noSelectedHint")}
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

function SortableTh({
  sortKey,
  ariaSort,
  onSort,
  className,
  align = "left",
  children,
}: SortableThProps) {
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
