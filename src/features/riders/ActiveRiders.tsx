import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { INITIAL_ACTIVE_RIDERS } from "@/mocks/data/riders";
import type { ActiveRider, RiderState } from "@/types/rider";
import { Badge } from "@/components/ui/badge";

// The Leaflet Popup only accepts inline styles, so these AA-safe hex values are copied from the theme tokens.
const STATE_HEX: Record<RiderState, string> = {
  dispatching: "#15803d", // --success
  arriving: "#a16207", // --state-arriving
  idle: "#dc2626", // --state-idle / --destructive
};

const STATE_BADGE_CLASS: Record<RiderState, string> = {
  dispatching:
    "bg-[color:var(--success-muted)] text-[color:var(--success)] border-[color:var(--success)]/25",
  arriving:
    "bg-[color:var(--state-arriving-muted)] text-[color:var(--state-arriving)] border-[color:var(--state-arriving)]/25",
  idle: "bg-[color:var(--state-idle-muted)] text-[color:var(--state-idle)] border-[color:var(--state-idle)]/25",
};

function jitter(val: number, amount = 0.003): number {
  return val + (Math.random() - 0.5) * amount;
}

const STATES: RiderState[] = ["idle", "arriving", "dispatching"];

function randomState(current: RiderState): RiderState {
  if (Math.random() < 0.85) return current;
  return STATES[Math.floor(Math.random() * STATES.length)];
}

export default function ActiveRiders() {
  const { t } = useTranslation();
  const stateLabel = (s: RiderState): string => t(`riders.active.states.${s}`);
  const [riders, setRiders] = useState<ActiveRider[]>(INITIAL_ACTIVE_RIDERS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRiders((prev) =>
        prev.map((r) => ({
          ...r,
          lat: jitter(r.lat),
          lng: jitter(r.lng),
          state: randomState(r.state),
        })),
      );
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const counts = {
    dispatching: riders.filter((r) => r.state === "dispatching").length,
    arriving: riders.filter((r) => r.state === "arriving").length,
    idle: riders.filter((r) => r.state === "idle").length,
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        {(["dispatching", "arriving", "idle"] as RiderState[]).map((s) => (
          <Badge
            key={s}
            className={`${STATE_BADGE_CLASS[s]} gap-2 px-4 py-2 text-sm font-medium rounded-full`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              aria-hidden="true"
              style={{ background: STATE_HEX[s] }}
            />
            {stateLabel(s)}: <strong>{counts[s]}</strong>
          </Badge>
        ))}
        <Badge className="bg-card border-border text-muted-foreground gap-2 px-4 py-2 text-sm font-medium rounded-full">
          {t("riders.active.total")} <strong className="text-foreground">{riders.length}</strong>
        </Badge>
        <Badge
          className="ml-auto bg-[color:var(--success-muted)] text-[color:var(--success)] border-[color:var(--success)]/25 gap-2 px-3 py-1.5 text-xs font-semibold rounded-full"
          aria-live="polite"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="motion-reduce:hidden animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[color:var(--success)]" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[color:var(--success)]" />
          </span>
          {t("riders.active.live")}
        </Badge>
      </div>

      <div
        className="flex-1 relative rounded-xl overflow-hidden border border-border"
        style={{ minHeight: 0 }}
      >
        <MapContainer
          center={[24.8607, 67.0011]}
          zoom={12}
          style={{ height: "100%", width: "100%", minHeight: "calc(100vh - 200px)" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {riders.map((rider) => (
            <CircleMarker
              key={rider.id}
              center={[rider.lat, rider.lng]}
              radius={10}
              pathOptions={{
                fillColor: STATE_HEX[rider.state],
                fillOpacity: 0.9,
                color: "#ffffff",
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: 160 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{rider.name}</p>
                  <p style={{ fontSize: 12, color: "#4a6b5e", marginBottom: 2 }}>📍 {rider.area}</p>
                  <p style={{ fontSize: 12, color: "#4a6b5e", marginBottom: 6 }}>🛵 {rider.bike}</p>
                  <span
                    style={{
                      display: "inline-block",
                      background: STATE_HEX[rider.state] + "22",
                      color: STATE_HEX[rider.state],
                      border: `1px solid ${STATE_HEX[rider.state]}44`,
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 10px",
                    }}
                  >
                    {stateLabel(rider.state)}
                  </span>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
