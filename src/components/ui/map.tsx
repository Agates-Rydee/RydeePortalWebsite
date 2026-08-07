import * as React from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

import { cn } from "./utils";

export type MapPosition = LatLngTuple;
export type MapBounds = LatLngBoundsExpression;

export interface MapProps {
  center: MapPosition;
  zoom?: number;
  bounds?: MapBounds;
  fitPadding?: [number, number];
  className?: string;
  height?: number | string;
  tileError?: React.ReactNode;
  children?: React.ReactNode;
}

function FitBoundsOnce({ bounds, padding }: { bounds: MapBounds; padding: [number, number] }) {
  const map = useMap();
  const doneRef = React.useRef(false);
  React.useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    map.fitBounds(bounds, { padding, animate: !reduce });
  }, [map, bounds, padding]);
  return null;
}

function TileErrorWatcher({ onError }: { onError: () => void }) {
  const map = useMap();
  React.useEffect(() => {
    const handler = () => onError();
    map.on("tileerror", handler);
    return () => {
      map.off("tileerror", handler);
    };
  }, [map, onError]);
  return null;
}

function Map({
  center,
  zoom = 13,
  bounds,
  fitPadding = [40, 40],
  className,
  height = 420,
  tileError,
  children,
}: MapProps) {
  const [errored, setErrored] = React.useState(false);

  if (errored && tileError) {
    return (
      <div
        data-slot="map-tile-error"
        className={cn(
          "rounded-2xl bg-muted flex items-center justify-center text-sm text-muted-foreground p-6 text-center",
          className,
        )}
        style={{ minHeight: typeof height === "number" ? height : undefined }}
      >
        {tileError}
      </div>
    );
  }

  return (
    <div
      data-slot="map"
      dir="ltr"
      className={cn("rounded-2xl overflow-hidden border border-border isolate", className)}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && <FitBoundsOnce bounds={bounds} padding={fitPadding} />}
        <TileErrorWatcher onError={() => setErrored(true)} />
        {children}
      </MapContainer>
    </div>
  );
}

export type MapMarkerVariant = "pickup" | "dropoff" | "rider";

const MARKER_COLOR: Record<MapMarkerVariant, string> = {
  pickup: "#15803d",
  dropoff: "#dc2626",
  rider: "#0369a1",
};

export interface MapMarkerProps {
  position: MapPosition;
  variant: MapMarkerVariant;
  ariaLabel: string;
  tooltip?: React.ReactNode;
  tooltipPermanent?: boolean;
  tooltipDirection?: "top" | "right" | "bottom" | "left";
  tooltipOffset?: [number, number];
  popupDir?: "ltr" | "rtl";
  children?: React.ReactNode;
}

function MapMarker({
  position,
  variant,
  ariaLabel,
  tooltip,
  tooltipPermanent = false,
  tooltipDirection = "top",
  tooltipOffset = [0, -8],
  popupDir = "ltr",
  children,
}: MapMarkerProps) {
  const color = MARKER_COLOR[variant];
  const radius = variant === "rider" ? 10 : 9;
  return (
    <CircleMarker
      center={position}
      radius={radius}
      pathOptions={{ fillColor: color, fillOpacity: 1, color: "#ffffff", weight: 2 }}
      aria-label={ariaLabel}
    >
      {tooltip && (
        <Tooltip
          direction={tooltipDirection}
          offset={tooltipOffset}
          opacity={1}
          permanent={tooltipPermanent}
        >
          <span dir={popupDir} style={{ textAlign: popupDir === "rtl" ? "right" : "left" }}>
            {tooltip}
          </span>
        </Tooltip>
      )}
      {children && (
        <Popup>
          <div dir={popupDir} style={{ textAlign: popupDir === "rtl" ? "right" : "left", minWidth: 160 }}>
            {children}
          </div>
        </Popup>
      )}
    </CircleMarker>
  );
}

export type MapPolylineVariant = "planned" | "traveled" | "fallback";

const LINE_COLOR: Record<MapPolylineVariant, string> = {
  planned: "#0369a1",
  traveled: "#15803d",
  fallback: "#6b7280",
};

export interface MapPolylineProps {
  positions: MapPosition[];
  variant?: MapPolylineVariant;
  dashed?: boolean;
}

function MapPolyline({ positions, variant = "planned", dashed = false }: MapPolylineProps) {
  return (
    <Polyline
      positions={positions}
      pathOptions={{
        color: LINE_COLOR[variant],
        weight: dashed ? 3 : 4,
        opacity: dashed ? 0.7 : 0.85,
        dashArray: dashed ? "8 8" : undefined,
      }}
    />
  );
}

export { Map, MapMarker, MapPolyline };
