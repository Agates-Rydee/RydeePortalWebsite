import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllRiders } from "@/api/riders";
import { mapAllRidersResponse } from "@/features/riders/mapper";
import type { AllRidersRow } from "@/types/rider";
import {
  getRides,
  getRidesSummary,
  LIVE_POLL_MS,
  type Ride,
  type RidesSummary,
} from "@/api/rides";
import { RidesTable } from "@/features/rides/components/RidesTable";

const RidesCharts = lazy(() =>
  import("./RidesCharts").then((m) => ({
    default: ({ summary }: { summary: RidesSummary }) => (
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <m.RidesOverviewChart summary={summary} />
        <m.BusyAreasChart summary={summary} />
      </div>
    ),
  })),
);

interface WireResponse {
  riders?: Array<Record<string, unknown>>;
}

interface StatCardProps {
  label: string;
  value: number | string | null;
  valueClassName?: string;
  hint: string;
  ariaLabel: string;
  onClick: () => void;
  icon: React.ReactNode;
}

function StatCard({ label, value, valueClassName, hint, ariaLabel, onClick, icon }: StatCardProps) {
  const display = value ?? "—";
  const interactive = value != null && value !== "—";
  const cardClasses =
    "rounded-xl gap-0 py-4 text-start w-full transition-shadow " +
    "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const content = (
    <>
      <CardHeader>
        <CardDescription className="text-xs">{label}</CardDescription>
        <CardTitle
          className={`text-2xl font-semibold tabular-nums @[250px]/card-header:text-3xl ${valueClassName ?? ""}`}
        >
          {display}
        </CardTitle>
        <CardAction className="text-muted-foreground">{icon}</CardAction>
      </CardHeader>
      <CardFooter className="pt-3 text-xs text-muted-foreground">{hint}</CardFooter>
    </>
  );
  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={
          "bg-card text-card-foreground flex flex-col gap-0 rounded-xl border py-4 text-start w-full transition-shadow " +
          "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        }
      >
        {content}
      </button>
    );
  }
  return <Card className={cardClasses}>{content}</Card>;
}

function tsOrNaN(iso: string | undefined): number {
  if (!iso) return Number.NaN;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? Number.NaN : t;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [rows, setRows] = useState<AllRidersRow[] | null>(null);
  const [liveRides, setLiveRides] = useState<Ride[] | null>(null);
  const [summary, setSummary] = useState<RidesSummary | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = (await getAllRiders()) as WireResponse;
        if (!data || !Array.isArray(data.riders))
          throw new Error(t("dashboards.errors.invalidResponse"));
        const mapped = mapAllRidersResponse(data.riders);
        if (!cancelled) setRows(mapped);
      } catch (err) {
        console.error(t("dashboards.errors.loadFailed"), err);
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchLive = async () => {
      try {
        const data = await getRides({ tab: "live" });
        if (!cancelled) setLiveRides(data.rides);
      } catch {
        if (!cancelled) setLiveRides([]);
      }
    };
    void fetchLive();
    const id = window.setInterval(fetchLive, LIVE_POLL_MS);
    const tickId = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearInterval(tickId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getRidesSummary();
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setSummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = rows?.length ?? null;
  const active = rows ? rows.filter((r) => r.status === "active").length : null;
  const pending = rows ? rows.filter((r) => r.status === "pending").length : null;
  const blocked = rows ? rows.filter((r) => r.status === "blocked").length : null;

  const topLive = (liveRides ?? [])
    .slice()
    .sort((a, b) => tsOrNaN(b.startedAt) - tsOrNaN(a.startedAt))
    .slice(0, 10);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dashboards.stats.totalRiders.label")}
          value={total}
          hint={t("dashboards.stats.totalRiders.hint")}
          ariaLabel={t("dashboards.stats.totalRiders.aria", { count: total ?? "—" })}
          onClick={() => navigate("/admin/all-riders")}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />

        <StatCard
          label={t("dashboards.stats.activeRiders.label")}
          value={active}
          valueClassName="text-primary"
          hint={t("dashboards.stats.activeRiders.hint")}
          ariaLabel={t("dashboards.stats.activeRiders.aria", { count: active ?? "—" })}
          onClick={() => navigate("/admin/active-riders")}
          icon={
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 bg-[color:var(--brand-bright)]" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[color:var(--brand-bright)]" />
            </span>
          }
        />

        <StatCard
          label={t("dashboards.stats.pendingRiders.label")}
          value={pending}
          valueClassName="text-warning"
          hint={t("dashboards.stats.pendingRiders.hint")}
          ariaLabel={t("dashboards.stats.pendingRiders.aria", { count: pending ?? "—" })}
          onClick={() => navigate("/admin/pending-riders")}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />

        <StatCard
          label={t("dashboards.stats.blockedRiders.label")}
          value={blocked}
          valueClassName="text-destructive"
          hint={t("dashboards.stats.blockedRiders.hint")}
          ariaLabel={t("dashboards.stats.blockedRiders.aria", { count: blocked ?? "—" })}
          onClick={() => navigate("/admin/blocked-riders")}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          }
        />
      </div>

      {summary && (
        <Suspense
          fallback={
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2" aria-hidden="true">
              <Card className="rounded-xl h-[360px] animate-pulse bg-muted/40" />
              <Card className="rounded-xl h-[360px] animate-pulse bg-muted/40" />
            </div>
          }
        >
          <RidesCharts summary={summary} />
        </Suspense>
      )}

      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {t("dashboards.activeRidesSection.heading")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("dashboards.activeRidesSection.subheading", { shown: topLive.length })}
          </p>
        </div>
        <Link
          to="/admin/rides?tab=live"
          className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1"
        >
          {t("dashboards.activeRidesSection.viewAll")}
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {liveRides === null ? (
          <div className="px-6 py-10 text-sm text-muted-foreground" role="status" aria-live="polite">
            {t("dashboards.activeRidesSection.loading")}
          </div>
        ) : topLive.length === 0 ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            {t("dashboards.activeRidesSection.empty")}
          </div>
        ) : (
          <RidesTable
            rides={topLive}
            tab="live"
            now={nowTick}
            caption={t("dashboards.activeRidesSection.caption")}
            compact
          />
        )}
      </div>
    </div>
  );
}
