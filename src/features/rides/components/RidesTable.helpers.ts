import type { Ride, RideStatus } from "@/api/rides";

const STALLED_MS = 3 * 60_000;

const LIVE_STATUSES: readonly RideStatus[] = [
  "going_to_pick",
  "waiting_for_ride",
  "in_transit",
  "arrived",
];

export function formatFare(f: Ride["fare"]): string {
  if (!f) return "—";
  return `${f.currency} ${f.amount.toLocaleString()}`;
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function minutesBetween(a: string | undefined, b: string | undefined): number | null {
  if (!a || !b) return null;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.max(0, Math.round((db - da) / 60_000));
}

export function isStalled(r: Ride, now: number): boolean {
  if (!LIVE_STATUSES.includes(r.status)) return false;
  if (r.status === "arrived") return false;
  if (!r.riderLocation) return false;
  const ts = new Date(r.riderLocation.updatedAt).getTime();
  if (Number.isNaN(ts)) return false;
  return now - ts >= STALLED_MS;
}

export const ARRIVED_RETENTION_MS = 2 * 60_000;
