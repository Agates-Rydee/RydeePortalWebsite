import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { INITIAL_ACTIVE_RIDERS, type ActiveRider, type RiderState } from "../data/mockData";
import { BackButton, Logo } from "../components/shared";

const STATE_COLOR: Record<RiderState, string> = {
  dispatching: "#22c55e",
  arriving:    "#eab308",
  idle:        "#ef4444",
};

const STATE_LABEL: Record<RiderState, string> = {
  dispatching: "Dispatching",
  arriving:    "Arriving",
  idle:        "Idle",
};

function jitter(val: number, amount = 0.003): number {
  return val + (Math.random() - 0.5) * amount;
}

const STATES: RiderState[] = ["idle", "arriving", "dispatching"];

function randomState(current: RiderState): RiderState {
  if (Math.random() < 0.85) return current;
  return STATES[Math.floor(Math.random() * STATES.length)];
}

export default function ActiveRiders({ onBack }: { onBack: () => void }) {
  const [riders, setRiders] = useState<ActiveRider[]>(INITIAL_ACTIVE_RIDERS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRiders(prev =>
        prev.map(r => ({
          ...r,
          lat: jitter(r.lat),
          lng: jitter(r.lng),
          state: randomState(r.state),
        }))
      );
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const counts = {
    dispatching: riders.filter(r => r.state === "dispatching").length,
    arriving:    riders.filter(r => r.state === "arriving").length,
    idle:        riders.filter(r => r.state === "idle").length,
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--background)" }}>
      {/* Header */}
      <header
        className="w-full flex items-center justify-between px-6 py-4 z-[1000] relative"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <BackButton onClick={onBack} label="Dashboard" />
          <Logo size="sm" />
        </div>
        {/* Live badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#22c55e" }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#22c55e" }} />
          </span>
          Live — updates every 3s
        </div>
      </header>

      {/* Stat pills */}
      <div className="flex gap-3 px-6 py-4 flex-wrap z-[999] relative" style={{ background: "var(--background)" }}>
        {(["dispatching", "arriving", "idle"] as RiderState[]).map(s => (
          <div key={s} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "var(--card)", border: `1px solid ${STATE_COLOR[s]}30`, color: STATE_COLOR[s] }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATE_COLOR[s] }} />
            {STATE_LABEL[s]}: <strong>{counts[s]}</strong>
          </div>
        ))}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
          Total: <strong style={{ color: "var(--foreground)" }}>{riders.length}</strong>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <MapContainer
          center={[24.8607, 67.0011]}
          zoom={12}
          style={{ height: "100%", width: "100%", minHeight: "calc(100vh - 140px)" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {riders.map(rider => (
            <CircleMarker
              key={rider.id}
              center={[rider.lat, rider.lng]}
              radius={10}
              pathOptions={{
                fillColor: STATE_COLOR[rider.state],
                fillOpacity: 0.9,
                color: "#ffffff",
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", minWidth: 160 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{rider.name}</p>
                  <p style={{ fontSize: 12, color: "#5a8070", marginBottom: 2 }}>📍 {rider.area}</p>
                  <p style={{ fontSize: 12, color: "#5a8070", marginBottom: 6 }}>🛵 {rider.bike}</p>
                  <span style={{
                    display: "inline-block",
                    background: STATE_COLOR[rider.state] + "22",
                    color: STATE_COLOR[rider.state],
                    border: `1px solid ${STATE_COLOR[rider.state]}44`,
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 10px",
                  }}>
                    {STATE_LABEL[rider.state]}
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
