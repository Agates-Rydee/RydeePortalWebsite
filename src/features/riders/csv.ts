// Hand-rolled RFC-4180 CSV serializer for the All Riders export (ADR-0004 §D2).
// Zero dependencies — CSV-only, XLSX deferred (D23).
//
// Rules:
//   - Fields containing comma, double-quote, CR, or LF are wrapped in "…".
//   - Inner double-quotes are doubled ("" per RFC-4180).
//   - Line ending is CRLF (\r\n).
//   - Header row emitted first, then data rows in the given order.
import type { AllRidersRow, RiderStatus } from "@/types/rider";

const NEEDS_QUOTE = /[",\r\n]/;

export function csvEscape(field: string): string {
  if (NEEDS_QUOTE.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

const STATUS_LABEL: Record<RiderStatus, string> = {
  active: "Active",
  pending: "Pending",
  blocked: "Blocked",
  offboarded: "Offboarded",
};

// Column order matches UX spec §2.1 (minus Actions).
export const CSV_HEADERS = [
  "Name",
  "Phone",
  "CNIC",
  "Status",
  "Area",
  "Joined",
] as const;

export function ridersToCsv(rows: readonly AllRidersRow[]): string {
  const header = CSV_HEADERS.map(csvEscape).join(",");
  const body = rows.map((r) =>
    [
      r.name,
      r.phone,
      r.cnic,
      STATUS_LABEL[r.status],
      r.area,
      r.joinedAt,
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header, ...body].join("\r\n");
}

/** Local YYYY-MM-DD. Local (not UTC) to match "current-day" admin intuition. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function csvFilename(statusTab: string, now: Date = new Date()): string {
  return `rydee-riders-${statusTab}-${todayIso(now)}.csv`;
}

/** Trigger a browser download for the given CSV text. Split for testability. */
export function downloadCsv(csv: string, filename: string): void {
  // Prepend UTF-8 BOM so Excel opens non-ASCII fields correctly.
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
