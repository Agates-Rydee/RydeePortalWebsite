import { joinUrl, post } from "./client";
import type { Profile } from "@/types/profile";

export const API_LOGIN_URL = joinUrl("/user/login");
export const API_REGISTER_URL = joinUrl("/register/user");

interface LoginResponse {
  role: string;
  profile: Profile;
}

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  password: string;
  role: string;
}

export function login(phone: string, password: string): Promise<LoginResponse> {
  return post<LoginResponse>(API_LOGIN_URL, { phone, password });
}

export function registerUser(payload: RegisterPayload): Promise<unknown> {
  return post<unknown>(API_REGISTER_URL, payload);
}
