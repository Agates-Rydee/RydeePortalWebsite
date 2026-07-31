import type { AllRidersRow, RiderStatus } from "@/types/rider";
import { serializeCsv } from "@/lib/csv";

const STATUS_LABEL: Record<RiderStatus, string> = {
  active: "Active",
  pending: "Pending",
  blocked: "Blocked",
  offboarded: "Offboarded",
};

export const CSV_HEADERS = [
  "Name",
  "Phone",
  "CNIC",
  "Status",
  "Area",
  "Joined",
] as const;

export function ridersToCsv(rows: readonly AllRidersRow[]): string {
  const body = rows.map((r) => [
    r.name,
    r.phone,
    r.cnic,
    STATUS_LABEL[r.status],
    r.area,
    r.joinedAt,
  ]);
  return serializeCsv(CSV_HEADERS, body);
}

// Uses local time (not UTC) so the filename matches the admin's calendar day.
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function csvFilename(statusTab: string, now: Date = new Date()): string {
  return `rydee-riders-${statusTab}-${todayIso(now)}.csv`;
}

export { downloadCsv } from "@/lib/csv";
