import { joinUrl, post } from "./client";
import type { Profile } from "@/types/profile";

export const API_LOGIN_URL = joinUrl("/user-login");
export const API_REGISTER_URL = joinUrl("/register-user");

interface LoginResponse {
  role: string;
  profile: Profile;
}

interface RegisterPayload {
  name: string;
  email?: string;
  phone: string;
  dob: string;
  address: string;
  password: string;
  role: string;
}

function titleCase(role: string): string {
  return role.length === 0 ? role : role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export async function login(phone: string, password: string): Promise<LoginResponse> {
  const raw = await post<{ role?: string; profile?: Partial<Profile> & { role?: string } }>(
    API_LOGIN_URL,
    { phone, password },
  );
  const rawProfileRole = raw.profile?.role;
  const topRole = raw.role ?? "";
  const canonical = titleCase(
    typeof rawProfileRole === "string" && rawProfileRole !== "" ? rawProfileRole : topRole,
  );
  const profile = { ...(raw.profile ?? {}), role: canonical } as Profile;
  return { role: canonical, profile };
}

export function registerUser(payload: RegisterPayload): Promise<unknown> {
  return post<unknown>(API_REGISTER_URL, payload);
}
