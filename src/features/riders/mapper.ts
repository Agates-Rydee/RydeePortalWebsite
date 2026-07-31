// Wire → domain mapping for the All Riders admin table (ADR-0004).
//
// Alias rules mirror `toPendingRider` (PendingRiders.tsx) exactly:
//   - `phone` field name (never `phoneNumber` — ADR-0003 ⁴).
//   - `area` may arrive as `rideArea` (backend Profile alias, 2026-07-30):
//     use `raw.area ?? raw.rideArea`.
//   - Status resolution (case-insensitive):
//       1. If `activation_status` (or `activationStatus`) is a non-empty
//          string, it wins. Recognized values: active|pending|blocked|
//          offboarded. Unknown → "pending" + console.warn.
//       2. Else if `activated === true`, status = "active".
//       3. Else default to "pending".
//
// Duplicated (not extracted) from PendingRiders.toPendingRider because that
// mapper targets a different row shape (PendingRider has dob/documents/pin);
// refactoring to a common base would change PendingRiders' behavior surface
// and risk the frozen 55-test suite. See ADR-0004 §"Data flow".
import type { AllRidersRow, RiderStatus } from "@/types/rider";

const KNOWN_STATUSES: readonly RiderStatus[] = [
  "active",
  "pending",
  "blocked",
  "offboarded",
];

function resolveStatus(raw: Record<string, unknown>): RiderStatus {
  const rawStatus = raw.activation_status ?? raw.activationStatus;
  const s = String(rawStatus ?? "").toLowerCase().trim();
  if (s !== "") {
    if ((KNOWN_STATUSES as readonly string[]).includes(s)) {
      return s as RiderStatus;
    }
    // Unknown status literal — normalize to pending and warn once per row.
    console.warn(`[mapper] unknown activation_status "${s}" → pending`);
    return "pending";
  }
  if (raw.activated === true) return "active";
  return "pending";
}

function str(raw: Record<string, unknown>, key: string): string {
  const v = raw[key];
  return typeof v === "string" ? v : "";
}

export function toAllRidersRow(
  raw: Record<string, unknown>,
  idx: number,
): AllRidersRow {
  const id = typeof raw.id === "number" ? raw.id : idx + 1;
  // Wire alias: area may be `rideArea` (backend Profile field name).
  const area =
    typeof raw.area === "string" && raw.area !== ""
      ? raw.area
      : typeof raw.rideArea === "string"
        ? raw.rideArea
        : "";
  // Best-effort optional detail fields (row → Sheet). Preserved when the
  // wire supplies them, undefined otherwise — Sheet renders "—" for missing.
  const dob = typeof raw.dob === "string" && raw.dob !== "" ? raw.dob : undefined;
  const pin = typeof raw.pin === "string" && raw.pin !== "" ? raw.pin : undefined;
  const documents = Array.isArray(raw.documents)
    ? (raw.documents as unknown[]).filter((d): d is string => typeof d === "string")
    : undefined;
  return {
    id,
    name: str(raw, "name"),
    phone: str(raw, "phone"),
    cnic: str(raw, "cnic"),
    status: resolveStatus(raw),
    area,
    joinedAt: str(raw, "joinedAt"),
    ...(dob !== undefined ? { dob } : {}),
    ...(pin !== undefined ? { pin } : {}),
    ...(documents && documents.length > 0 ? { documents } : {}),
  };
}

export function mapAllRidersResponse(
  riders: ReadonlyArray<Record<string, unknown>>,
): AllRidersRow[] {
  return riders.map((r, i) => toAllRidersRow(r, i));
}
