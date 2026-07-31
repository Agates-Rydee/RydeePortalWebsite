// The mapping rules here deliberately mirror the equivalent code in PendingRiders.
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
    // Any recognisable but unlisted status is coerced to pending so downstream
    // code always sees a value from the enum; the warning surfaces the mismatch
    // during development without breaking the render path.
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
  const area =
    typeof raw.area === "string" && raw.area !== ""
      ? raw.area
      : typeof raw.rideArea === "string"
        ? raw.rideArea
        : "";
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
