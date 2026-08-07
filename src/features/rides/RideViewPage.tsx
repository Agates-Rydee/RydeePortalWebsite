import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { getRide, type Ride, type RideStatus } from "@/api/rides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, User, MapPin, Banknote, Clock, Timer, Route, Hourglass, CheckCircle2 } from "lucide-react";

const RideMap = lazy(() => import("./RideMap"));

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

const LIVE_STATUSES: RideStatus[] = ["going_to_pick", "waiting_for_ride", "in_transit", "arrived"];
const POLL_MS = 12000;
const STALE_MS = 3 * 60 * 1000;

function isLive(status: RideStatus): boolean {
  return LIVE_STATUSES.includes(status);
}

export default function RideViewPage() {
  const { t } = useTranslation();
  const { rideId } = useParams<{ rideId: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!rideId) {
      setNotFound(true);
      return;
    }
    (async () => {
      try {
        const data = await getRide(rideId);
        if (cancelled) return;
        setRide(data.ride);
      } catch (err) {
        if (cancelled) return;
        const status = (err as { status?: number } | null)?.status;
        if (status === 404) {
          setNotFound(true);
        } else if (status === 0 || status === undefined) {
          setUnavailable(true);
        } else {
          setError(err instanceof Error ? err.message : t("rides.errors.loadFailed"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rideId, t]);

  const liveMode = ride ? isLive(ride.status) : false;
  useEffect(() => {
    if (!rideId || !liveMode) return;
    pollRef.current = setInterval(async () => {
      try {
        const data = await getRide(rideId);
        setRide(data.ride);
      } catch {
        // ignore transient poll errors; next tick retries
      }
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [rideId, liveMode]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!liveMode) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [liveMode]);

  const backLink = (
    <Button
      asChild
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0"
      aria-label={t("rides.viewRidePage.back")}
    >
      <Link to="/admin/rides">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Button>
  );

  if (notFound) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-2">{backLink}</div>
        <Card className="px-6 py-12 text-center rounded-2xl">
          <p className="text-sm font-medium text-foreground">
            {t("rides.viewRidePage.notFoundTitle")}
          </p>
          <p className="text-xs mt-1 text-muted-foreground">
            {t("rides.viewRidePage.notFoundHint")}
          </p>
        </Card>
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-2">{backLink}</div>
        <Card className="px-6 py-12 text-center rounded-2xl">
          <p className="text-sm font-medium text-foreground">{t("rides.unavailableTitle")}</p>
          <p className="text-xs mt-1 text-muted-foreground">{t("rides.unavailableHint")}</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-2">{backLink}</div>
        <div role="alert" className="text-sm text-destructive bg-destructive/10 rounded-lg p-4">
          {error}
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-2">{backLink}</div>
        <div role="status" className="text-sm text-muted-foreground">
          {t("rides.loading")}
        </div>
      </div>
    );
  }

  const fareText = ride.fare
    ? `${ride.fare.currency} ${ride.fare.amount.toLocaleString()}`
    : "\u2014";

  const formatMinutes = (n: number) => t("rides.viewRidePage.minutesValue", { count: n });
  const formatKm = (n: number) => t("rides.viewRidePage.kmValue", { km: n.toFixed(1) });
  const formatClock = (ms: number) => {
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };
  const completedDurationMin =
    ride.status === "completed" && ride.startedAt && ride.completedAt
      ? Math.max(
          0,
          Math.round(
            (new Date(ride.completedAt).getTime() - new Date(ride.startedAt).getTime()) / 60000,
          ),
        )
      : null;
  const completedAtClock = ride.completedAt ? formatClock(new Date(ride.completedAt).getTime()) : null;
  const estCompletionClock =
    liveMode && ride.eta ? formatClock(now + ride.eta.minutes * 60000) : null;

  const stalled =
    liveMode &&
    ride.riderLocation &&
    now - new Date(ride.riderLocation.updatedAt).getTime() > STALE_MS;

  const freshnessSec = ride.riderLocation
    ? Math.max(0, Math.floor((now - new Date(ride.riderLocation.updatedAt).getTime()) / 1000))
    : null;
  const freshnessText =
    freshnessSec === null
      ? null
      : freshnessSec < 60
        ? t("rides.markers.updatedAgo", {
            value: freshnessSec,
            unit: t("rides.markers.units.sec"),
          })
        : t("rides.markers.updatedAgo", {
            value: Math.floor(freshnessSec / 60),
            unit: t("rides.markers.units.min"),
          });

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 p-4 md:p-6">
      <div className="flex items-center gap-2">
        {backLink}
        <h2 className="text-lg font-semibold font-mono">{ride.rideId}</h2>
        <Badge
          className="gap-1.5 rounded-full border-transparent px-2.5 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: STATUS_BG[ride.status] }}
        >
          {t(STATUS_KEY[ride.status])}
        </Badge>
        {stalled && (
          <Badge className="gap-1.5 rounded-full border-transparent px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-900">
            {t("rides.viewRidePage.stalled")}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col md:flex-row gap-4 min-h-0">
        <Card className="rounded-2xl p-4 md:p-5 flex flex-col gap-3 md:w-[340px] md:shrink-0 md:self-start md:max-h-full md:overflow-y-auto">
          <h3 className="text-base font-semibold">{t("rides.viewRidePage.detailsTitle")}</h3>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3">
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                <User className="h-4 w-4" aria-hidden="true" />
                {t("rides.columns.rider")}
              </dt>
              <dd className="font-medium text-sm">
                {ride.rider.name}
                <span className="ms-2 font-mono text-xs text-muted-foreground">
                  {ride.rider.phone}
                </span>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                <User className="h-4 w-4" aria-hidden="true" />
                {t("rides.columns.customer")}
              </dt>
              <dd className="font-medium text-sm">
                {ride.customer.name}
                <span className="ms-2 font-mono text-xs text-muted-foreground">
                  {ride.customer.phone}
                </span>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {t("rides.columns.pickup")}
              </dt>
              <dd className="text-sm">{ride.pickup.label}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {t("rides.columns.dropoff")}
              </dt>
              <dd className="text-sm">{ride.dropoff.label}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                <Banknote className="h-4 w-4" aria-hidden="true" />
                {t("rides.columns.fare")}
              </dt>
              <dd className="text-sm">{fareText}</dd>
            </div>
            {ride.status === "completed" && completedDurationMin !== null && completedAtClock && (
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {t("rides.viewRidePage.completion")}
                </dt>
                <dd className="text-sm">
                  {completedAtClock} · {formatMinutes(completedDurationMin)}
                </dd>
              </div>
            )}
            {ride.status === "completed" && ride.traveledDistanceKm !== undefined && (
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                  <Route className="h-4 w-4" aria-hidden="true" />
                  {t("rides.viewRidePage.distanceTraveled")}
                </dt>
                <dd className="text-sm">{formatKm(ride.traveledDistanceKm)}</dd>
              </div>
            )}
            {liveMode && ride.plannedDistanceKm !== undefined && (
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                  <Route className="h-4 w-4" aria-hidden="true" />
                  {t("rides.viewRidePage.plannedDistance")}
                </dt>
                <dd className="text-sm">{formatKm(ride.plannedDistanceKm)}</dd>
              </div>
            )}
            {(ride.status === "completed" || liveMode) && ride.waitingMinutes !== undefined && (
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                  <Hourglass className="h-4 w-4" aria-hidden="true" />
                  {t("rides.viewRidePage.waitingTime")}
                </dt>
                <dd className="text-sm">{formatMinutes(ride.waitingMinutes)}</dd>
              </div>
            )}
            {estCompletionClock && (
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                  <Timer className="h-4 w-4" aria-hidden="true" />
                  {t("rides.viewRidePage.estCompletion")}
                </dt>
                <dd className="text-sm">{estCompletionClock}</dd>
              </div>
            )}
                        {liveMode && freshnessText && (
              <div className="flex flex-col">
                <dt className="text-sm font-medium text-muted-foreground inline-flex items-center gap-2">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {t("rides.viewRidePage.lastUpdate")}
                </dt>
                <dd className="text-sm">{freshnessText}</dd>
              </div>
            )}
          </dl>
        </Card>

        <div
          role="img"
          aria-label={t("rides.viewRidePage.mapAria", { id: ride.rideId })}
          className="flex-1 min-h-[320px] md:min-h-0"
        >
          <Suspense
            fallback={
              <div className="h-full rounded-2xl border border-border bg-muted/30 flex items-center justify-center min-h-[320px] text-sm text-muted-foreground">
                {t("rides.loading")}
              </div>
            }
          >
            <RideMap ride={ride} height="100%" now={now} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
