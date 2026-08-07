import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Map, MapMarker, MapPolyline, type MapPosition } from "@/components/ui/map";
import type { Ride, RideStatus } from "@/api/rides";

const LIVE_STATUSES: RideStatus[] = ["going_to_pick", "waiting_for_ride", "in_transit", "arrived"];

function isLive(status: RideStatus): boolean {
  return LIVE_STATUSES.includes(status);
}

function parsePath(raw: string | undefined): MapPosition[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: MapPosition[] = [];
    for (const p of parsed) {
      if (Array.isArray(p) && p.length >= 2 && typeof p[0] === "number" && typeof p[1] === "number") {
        out.push([p[0], p[1]]);
      }
    }
    return out;
  } catch {
    return [];
  }
}

function formatUpdatedAgo(iso: string, now: number): { value: number; unit: "sec" | "min" } {
  const diff = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (diff < 60) return { value: diff, unit: "sec" };
  return { value: Math.floor(diff / 60), unit: "min" };
}

export interface RideMapProps {
  ride: Ride;
  height?: number | string;
  now: number;
}

export default function RideMap({ ride, height = 420, now }: RideMapProps) {
  const { t, i18n } = useTranslation();
  const popupDir: "ltr" | "rtl" = i18n.language === "ur" ? "rtl" : "ltr";
  const live = isLive(ride.status);
  const completed = ride.status === "completed";

  const pickup: MapPosition = [ride.pickup.lat, ride.pickup.lng];
  const dropoff: MapPosition = [ride.dropoff.lat, ride.dropoff.lng];

  const routeCoords = useMemo(() => parsePath(ride.routePolyline), [ride.routePolyline]);
  const traveledCoords = useMemo(() => parsePath(ride.traveledPath), [ride.traveledPath]);

  const geometryFallback = !completed && routeCoords.length === 0;
  const completedFallback = completed && traveledCoords.length === 0 && routeCoords.length === 0;
  const degraded = geometryFallback || completedFallback;

  const riderPos: MapPosition | null =
    live && ride.riderLocation ? [ride.riderLocation.lat, ride.riderLocation.lng] : null;

  const riderFreshness = ride.riderLocation
    ? formatUpdatedAgo(ride.riderLocation.updatedAt, now)
    : null;

  const riderLabel = ride.eta
    ? t("rides.markers.riderWithEta", {
        minutes: ride.eta.minutes,
        km: ride.eta.distanceKm.toFixed(1),
      })
    : t("rides.markers.rider");

  return (
    <div className="flex h-full flex-col gap-2">
      <Map
        center={pickup}
        bounds={[pickup, dropoff]}
        height={height}
        tileError={t("rides.viewRidePage.tileError")}
        className="flex-1"
      >
        {completed && traveledCoords.length >= 2 && (
          <MapPolyline positions={traveledCoords} variant="traveled" />
        )}
        {completed && traveledCoords.length < 2 && routeCoords.length >= 2 && (
          <MapPolyline positions={routeCoords} variant="traveled" />
        )}
        {live && routeCoords.length >= 2 && (
          <MapPolyline positions={routeCoords} variant="planned" />
        )}
        {(degraded || (completed && traveledCoords.length < 2 && routeCoords.length < 2)) && (
          <MapPolyline positions={[pickup, dropoff]} variant="fallback" dashed />
        )}

        <MapMarker
          position={pickup}
          variant="pickup"
          ariaLabel={t("rides.markers.pickup")}
          tooltip={t("rides.markers.pickup")}
          tooltipPermanent
          tooltipDirection="left"
          tooltipOffset={[-12, 0]}
          popupDir={popupDir}
        >
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            {t("rides.markers.pickup")}
          </p>
          <p style={{ fontSize: 12, color: "#4a6b5e" }}>{ride.pickup.label}</p>
        </MapMarker>

        <MapMarker
          position={dropoff}
          variant="dropoff"
          ariaLabel={t("rides.markers.dropoff")}
          tooltip={t("rides.markers.dropoff")}
          tooltipPermanent
          tooltipDirection="right"
          tooltipOffset={[12, 0]}
          popupDir={popupDir}
        >
          <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            {t("rides.markers.dropoff")}
          </p>
          <p style={{ fontSize: 12, color: "#4a6b5e" }}>{ride.dropoff.label}</p>
        </MapMarker>

        {riderPos && (
          <MapMarker
            position={riderPos}
            variant="rider"
            ariaLabel={riderLabel}
            tooltip={riderLabel}
            tooltipPermanent
            tooltipDirection="top"
            tooltipOffset={[0, -12]}
            popupDir={popupDir}
          >
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{riderLabel}</p>
            {riderFreshness && (
              <p style={{ fontSize: 12, color: "#4a6b5e" }}>
                {t("rides.markers.updatedAgo", {
                  value: riderFreshness.value,
                  unit: t(`rides.markers.units.${riderFreshness.unit}`),
                })}
              </p>
            )}
          </MapMarker>
        )}
      </Map>
      {degraded && (
        <p className="text-xs text-muted-foreground">{t("rides.viewRidePage.geometryUnavailable")}</p>
      )}
    </div>
  );
}
