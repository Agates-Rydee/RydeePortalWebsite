import { useEffect, useState } from "react";
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

interface WireResponse {
  riders?: Array<Record<string, unknown>>;
}

function formatJoined(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
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
  const interactive = value != null;
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

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [rows, setRows] = useState<AllRidersRow[] | null>(null);

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

  const total = rows?.length ?? null;
  const active = rows ? rows.filter((r) => r.status === "active").length : null;
  const pending = rows ? rows.filter((r) => r.status === "pending").length : null;
  const blocked = rows ? rows.filter((r) => r.status === "blocked").length : null;
  const activeRows = (rows ?? []).filter((r) => r.status === "active").slice(0, 10);

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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          }
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {t("dashboards.activeRidersSection.heading")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("dashboards.activeRidersSection.subheading", {
              shown: activeRows.length,
              total: active ?? 0,
            })}
          </p>
        </div>
        <Link
          to="/admin/active-riders"
          className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1"
        >
          {t("dashboards.activeRidersSection.viewAll")}
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {rows === null ? (
          <div
            className="px-6 py-10 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {t("dashboards.activeRidersSection.loading")}
          </div>
        ) : activeRows.length === 0 ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">
            {t("dashboards.activeRidersSection.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-switch-background text-[11px] font-semibold text-foreground/70 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("dashboards.activeRidersSection.columns.name")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("dashboards.activeRidersSection.columns.phone")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("dashboards.activeRidersSection.columns.area")}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">
                    {t("dashboards.activeRidersSection.columns.joined")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 font-medium text-foreground text-start">
                      {r.name || "—"}
                    </th>
                    <td className="px-4 py-3 font-mono text-xs">{r.phone || "—"}</td>
                    <td className="px-4 py-3">{r.area || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatJoined(r.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
