import { joinUrl, post } from "./client";

export const API_GET_UNREGISTERED_RIDERS_URL = joinUrl("/get-all-inactive-riders");
export const API_GET_ALL_RIDERS_URL = joinUrl("/get-all-riders");

interface RidersResponse {
  riders?: Array<Record<string, unknown>>;
}

interface WireRider {
  role?: unknown;
  profile?: unknown;
  [key: string]: unknown;
}

function flattenRider(r: WireRider): Record<string, unknown> {
  const profile = r.profile;
  if (!profile || typeof profile !== "object") {
    return r as Record<string, unknown>;
  }
  const flat: Record<string, unknown> = { ...(profile as Record<string, unknown>) };
  if (typeof r.role !== "undefined" && !("role" in flat)) flat.role = r.role;
  // Map new dateOfJoining onto the joinedAt field the mapper/UI already consume.
  if (typeof flat.joinedAt === "undefined" && typeof flat.dateOfJoining === "string") {
    flat.joinedAt = String(flat.dateOfJoining);
  }
  return flat;
}

function normalise(res: { riders?: unknown }): RidersResponse {
  if (!res || !Array.isArray(res.riders)) return { riders: [] };
  return {
    riders: (res.riders as WireRider[]).map(flattenRider),
  };
}

export async function getUnregisteredRiders(): Promise<RidersResponse> {
  const raw = await post<{ riders?: unknown }>(API_GET_UNREGISTERED_RIDERS_URL);
  return normalise(raw);
}

export async function getAllRiders(): Promise<RidersResponse> {
  const raw = await post<{ riders?: unknown }>(API_GET_ALL_RIDERS_URL);
  return normalise(raw);
}
