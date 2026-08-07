import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { Ride, RideStatus, RideTab, RideSortKey, RideSortDir } from "@/api/rides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ARRIVED_RETENTION_MS,
  formatFare,
  formatTime,
  isStalled,
  minutesBetween,
} from "./RidesTable.helpers";

const STATUS_BG: Record<RideStatus, string> = {
  going_to_pick: "#b45309",
  waiting_for_ride: "#0369a1",
  in_transit: "#15803d",
  arrived: "#6b7280",
  scheduled: "#6d28d9",
  completed: "#15803d",
  canceled: "#dc2626",
};

const STATUS_KEY: Record<RideStatus, string> = {
  going_to_pick: "rides.status.goingToPick",
  waiting_for_ride: "rides.status.waitingForRide",
  in_transit: "rides.status.inTransit",
  arrived: "rides.status.arrived",
  scheduled: "rides.status.scheduled",
  completed: "rides.status.completed",
  canceled: "rides.status.canceled",
};

export function StatusPill({ status }: { status: RideStatus }) {
  const { t } = useTranslation();
  return (
    <Badge
      className="gap-1.5 rounded-full border-transparent px-2.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: STATUS_BG[status] }}
    >
      {t(STATUS_KEY[status])}
    </Badge>
  );
}

function TwoLine({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="font-medium text-foreground">{top || "—"}</span>
      <span className="font-mono text-[11px] text-muted-foreground">{bottom || "—"}</span>
    </div>
  );
}

interface RowProps {
  ride: Ride;
  tab: RideTab;
  stalled: boolean;
  arrivedLeaving: string | null;
  compact: boolean;
}

function DesktopRow({ ride, tab, stalled, arrivedLeaving, compact }: RowProps) {
  const { t } = useTranslation();
  const canView = tab === "live" || tab === "completed";
  const elapsed = tab === "live" ? minutesBetween(ride.startedAt, new Date().toISOString()) : null;
  const dur = tab === "completed" ? minutesBetween(ride.startedAt, ride.completedAt) : null;
  const rowClass =
    "h-14 " + (stalled ? "bg-amber-50 dark:bg-amber-950/20" : "hover:bg-muted/30");
  const statusCell = (
    <td className="px-4 py-2">
      <div className="flex items-center gap-2">
        <StatusPill status={ride.status} />
        {stalled && (
          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
            {t("rides.stalled")}
          </span>
        )}
        {arrivedLeaving && (
          <span className="text-[11px] text-muted-foreground">{arrivedLeaving}</span>
        )}
      </div>
    </td>
  );
  const idCell = compact ? (
    <td className="ps-6 pe-4 py-2 font-mono text-xs">
      <Link
        to={`/admin/rides/${encodeURIComponent(ride.rideId)}`}
        className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        {ride.rideId}
      </Link>
    </td>
  ) : (
    <td className="ps-6 pe-4 py-2 font-mono text-xs">{ride.rideId}</td>
  );
  return (
    <tr
      aria-label={
        stalled
          ? t("rides.rowStalledAria", { id: ride.rideId })
          : t("rides.rowAria", { id: ride.rideId })
      }
      className={rowClass}
    >
      {idCell}
      {compact && statusCell}
      <td className="px-4 py-2"><TwoLine top={ride.rider.name} bottom={ride.rider.phone} /></td>
      {!compact && <td className="px-4 py-2"><TwoLine top={ride.customer.name} bottom={ride.customer.phone} /></td>}
      <td className="px-4 py-2 max-w-[180px] truncate" title={ride.pickup.label}>{ride.pickup.label}</td>
      <td className="px-4 py-2 max-w-[180px] truncate" title={ride.dropoff.label}>{ride.dropoff.label}</td>
      {!compact && statusCell}
      {!compact && <td className="px-4 py-2 whitespace-nowrap">{formatFare(ride.fare)}</td>}
      {tab === "live" && (
        <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
          {elapsed !== null ? t("rides.minutesShort", { n: elapsed }) : "—"}
        </td>
      )}
      {tab === "upcoming" && !compact && (
        <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
          {formatTime(ride.scheduledAt)}
        </td>
      )}
      {tab === "completed" && !compact && (
        <td className="px-4 py-2 whitespace-nowrap text-xs text-muted-foreground">
          {formatTime(ride.completedAt)}
          {dur !== null && <span className="ms-2">· {t("rides.minutesShort", { n: dur })}</span>}
        </td>
      )}
      {tab === "canceled" && !compact && (
        <td className="px-4 py-2 text-xs text-muted-foreground">
          {ride.canceledBy ? t(`rides.canceledBy.${ride.canceledBy}`) : "—"}
          {ride.cancelReason && <span className="ms-2">· {ride.cancelReason}</span>}
        </td>
      )}
      {!compact && (
        <td className="ps-4 pe-6 py-2 text-center">
          {canView ? (
            <Button asChild type="button" variant="outline" size="sm">
              <Link
                to={`/admin/rides/${encodeURIComponent(ride.rideId)}`}
                aria-label={t("rides.viewRideAria", { id: ride.rideId })}
              >
                {t("rides.viewRide")}
              </Link>
            </Button>
          ) : (
            <span aria-hidden="true">—</span>
          )}
        </td>
      )}
    </tr>
  );
}

function MobileCard({ ride, tab, stalled, arrivedLeaving, compact }: RowProps) {
  const { t } = useTranslation();
  const canView = tab === "live" || tab === "completed";
  return (
    <div
      className={
        "rounded-lg border p-3 flex flex-col gap-2 " +
        (stalled
          ? "border-amber-500 border-s-4 bg-amber-50 dark:bg-amber-950/20"
          : "border-border bg-card")
      }
    >
      <div className="flex items-center justify-between gap-2">
        {compact ? (
          <Link
            to={`/admin/rides/${encodeURIComponent(ride.rideId)}`}
            className="font-mono text-xs hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {ride.rideId}
          </Link>
        ) : (
          <span className="font-mono text-xs">{ride.rideId}</span>
        )}
        <StatusPill status={ride.status} />
      </div>
      <div className="text-sm">
        <span className="text-muted-foreground">{t("rides.columns.rider")}: </span>
        {ride.rider.name} · <span className="font-mono text-xs">{ride.rider.phone}</span>
      </div>
      {!compact && (
        <div className="text-sm">
          <span className="text-muted-foreground">{t("rides.columns.customer")}: </span>
          {ride.customer.name} · <span className="font-mono text-xs">{ride.customer.phone}</span>
        </div>
      )}
      <div className="text-sm">
        <div><span className="text-muted-foreground">{t("rides.columns.pickup")}: </span>{ride.pickup.label}</div>
        <div><span className="text-muted-foreground">{t("rides.columns.dropoff")}: </span>{ride.dropoff.label}</div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {!compact && <span>{t("rides.columns.fare")}: {formatFare(ride.fare)}</span>}
        {tab === "upcoming" && ride.scheduledAt && !compact && (
          <span>{t("rides.columns.scheduledAt")}: {formatTime(ride.scheduledAt)}</span>
        )}
        {tab === "completed" && ride.completedAt && !compact && (
          <span>{t("rides.columns.completedAt")}: {formatTime(ride.completedAt)}</span>
        )}
        {tab === "canceled" && ride.canceledBy && !compact && (
          <span>{t("rides.columns.canceledBy")}: {t(`rides.canceledBy.${ride.canceledBy}`)}</span>
        )}
        {stalled && <span className="text-amber-700 dark:text-amber-300 font-medium">{t("rides.stalled")}</span>}
        {arrivedLeaving && <span>{arrivedLeaving}</span>}
      </div>
      {canView && !compact && (
        <div className="pt-1">
          <Button asChild type="button" variant="outline" size="sm">
            <Link
              to={`/admin/rides/${encodeURIComponent(ride.rideId)}`}
              aria-label={t("rides.viewRideAria", { id: ride.rideId })}
            >
              {t("rides.viewRide")}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

interface SortableThProps {
  sortKey: RideSortKey;
  ariaSort: "ascending" | "descending" | "none";
  onSort: (key: RideSortKey) => void;
  className?: string;
  label: string;
}

function SortableTh({ sortKey, ariaSort, onSort, className, label }: SortableThProps) {
  const indicator = ariaSort === "ascending" ? "↑" : ariaSort === "descending" ? "↓" : "↕";
  return (
    <th scope="col" aria-sort={ariaSort} className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
      >
        {label}
        <span aria-hidden="true" className={ariaSort === "none" ? "opacity-40" : "text-foreground"}>
          {indicator}
        </span>
      </button>
    </th>
  );
}

function PlainTh({ className, label }: { className?: string; label: string }) {
  return (
    <th scope="col" className={className}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
        {label}
      </span>
    </th>
  );
}

export interface RidesTableProps {
  rides: Ride[];
  tab: RideTab;
  now: number;
  caption: string;
  sort?: { key: RideSortKey; dir: RideSortDir };
  onSort?: (key: RideSortKey) => void;
  compact?: boolean;
  arrivedFirstSeen?: Map<string, number>;
}

export function RidesTable({
  rides,
  tab,
  now,
  caption,
  sort,
  onSort,
  compact = false,
  arrivedFirstSeen,
}: RidesTableProps) {
  const { t } = useTranslation();
  const sortable = sort !== undefined && onSort !== undefined;

  const ariaSortFor = (key: RideSortKey): "ascending" | "descending" | "none" => {
    if (!sort || sort.key !== key) return "none";
    return sort.dir === "asc" ? "ascending" : "descending";
  };

  const renderTh = (key: RideSortKey, className: string, label: string) =>
    sortable ? (
      <SortableTh sortKey={key} ariaSort={ariaSortFor(key)} onSort={onSort!} className={className} label={label} />
    ) : (
      <PlainTh className={className} label={label} />
    );

  const decorateRow = (r: Ride) => {
    const stalled = tab === "live" && isStalled(r, now);
    let leaving: string | null = null;
    if (tab === "live" && r.status === "arrived" && arrivedFirstSeen) {
      const first = arrivedFirstSeen.get(r.rideId) ?? now;
      const remaining = Math.max(0, ARRIVED_RETENTION_MS - (now - first));
      const mm = Math.floor(remaining / 60_000);
      const ss = Math.floor((remaining % 60_000) / 1000);
      leaving = t("rides.leavingIn", { time: `${mm}:${String(ss).padStart(2, "0")}` });
    }
    return { stalled, leaving };
  };

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-10 bg-switch-background text-start text-[11px] font-semibold text-foreground/70 uppercase tracking-wider shadow-[inset_0_-1px_0_hsl(var(--border))]">
            <tr>
              {renderTh("rideId", "ps-6 pe-4 py-3 min-w-[110px]", t("rides.columns.rideId"))}
              {compact && renderTh("status", "px-4 py-3 min-w-[130px]", t("rides.columns.status"))}
              {renderTh("riderName", "px-4 py-3 min-w-[150px]", t("rides.columns.rider"))}
              {!compact && renderTh("customerName", "px-4 py-3 min-w-[150px]", t("rides.columns.customer"))}
              {renderTh("pickupLabel", "px-4 py-3 min-w-[140px]", t("rides.columns.pickup"))}
              {renderTh("dropoffLabel", "px-4 py-3 min-w-[140px]", t("rides.columns.dropoff"))}
              {!compact && renderTh("status", "px-4 py-3 min-w-[130px]", t("rides.columns.status"))}
              {!compact && renderTh("fareAmount", "px-4 py-3 min-w-[100px]", t("rides.columns.fare"))}
              {tab === "live" && renderTh("startedAt", "px-4 py-3 min-w-[90px]", t("rides.columns.elapsed"))}
              {tab === "upcoming" && !compact && renderTh("scheduledAt", "px-4 py-3 min-w-[110px]", t("rides.columns.scheduledAt"))}
              {tab === "completed" && !compact && renderTh("completedAt", "px-4 py-3 min-w-[130px]", t("rides.columns.completedAt"))}
              {tab === "canceled" && !compact && renderTh("canceledBy", "px-4 py-3 min-w-[160px]", t("rides.columns.canceledBy"))}
              {!compact && <th scope="col" className="ps-4 pe-6 py-3 w-[110px] text-center">{t("rides.columns.actions")}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rides.map((r) => {
              const { stalled, leaving } = decorateRow(r);
              return (
                <DesktopRow key={r.rideId} ride={r} tab={tab} stalled={stalled} arrivedLeaving={leaving} compact={compact} />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3 p-3">
        {rides.map((r) => {
          const { stalled, leaving } = decorateRow(r);
          return (
            <MobileCard key={r.rideId} ride={r} tab={tab} stalled={stalled} arrivedLeaving={leaving} compact={compact} />
          );
        })}
      </div>
    </>
  );
}
