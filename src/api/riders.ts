import { joinUrl, post } from "./client";

export const API_GET_UNREGISTERED_RIDERS_URL = joinUrl("/get-all-inactive-riders");
export const API_GET_ALL_RIDERS_URL = joinUrl("/get-all-riders");
export const API_ACTIVATE_RIDER_URL = joinUrl("/activate-rider");
export const API_UPDATE_USER_URL = joinUrl("/update-user");

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

function isNoRidersFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  try {
    const body: unknown = JSON.parse(err.message);
    if (!body || typeof body !== "object") return false;
    const b = body as Record<string, unknown>;
    return b.success === false && !Array.isArray(b.riders);
  } catch {
    return false;
  }
}

export async function getUnregisteredRiders(): Promise<RidersResponse> {
  try {
    const raw = await post<{ riders?: unknown }>(API_GET_UNREGISTERED_RIDERS_URL);
    return normalise(raw);
  } catch (err) {
    if (isNoRidersFoundError(err)) return { riders: [] };
    throw err;
  }
}

export async function getAllRiders(): Promise<RidersResponse> {
  const raw = await post<{ riders?: unknown }>(API_GET_ALL_RIDERS_URL);
  return normalise(raw);
}

export interface ActivateRiderResponse {
  success: boolean;
  message?: string;
  error?: string;
  updatedFields?: { activation_status?: string };
}

export function activateRider(phone: string, pin: string): Promise<ActivateRiderResponse> {
  return post<ActivateRiderResponse>(API_ACTIVATE_RIDER_URL, { phone, pin });
}

export interface UpdateUserResponse {
  message: string;
  updatedFields?: Record<string, unknown>;
}

export function updateUser(
  phone: string,
  role: string,
  fields: Record<string, unknown>,
): Promise<UpdateUserResponse> {
  return post<UpdateUserResponse>(API_UPDATE_USER_URL, { phone, role, ...fields });
}

