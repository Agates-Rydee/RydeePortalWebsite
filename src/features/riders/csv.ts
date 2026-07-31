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

/** Returns today's date as YYYY-MM-DD in local time so filenames match the admin's calendar day. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function csvFilename(statusTab: string, now: Date = new Date()): string {
  return `rydee-riders-${statusTab}-${todayIso(now)}.csv`;
}

/** Triggers a browser download for the given CSV text. Split out so tests can call the serializer without touching the DOM. */
export function downloadCsv(csv: string, filename: string): void {
  // Prepend the UTF-8 byte-order mark so Excel opens non-ASCII fields correctly.
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
