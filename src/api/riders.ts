import { joinUrl, post } from "./client";

export const API_GET_UNREGISTERED_RIDERS_URL = joinUrl("/GetAll/UnregisteredRiders");
export const API_GET_ALL_RIDERS_URL = joinUrl("/GetAll/Riders");

interface RidersResponse {
  riders?: Array<Record<string, unknown>>;
}

export function getUnregisteredRiders(): Promise<RidersResponse> {
  return post<RidersResponse>(API_GET_UNREGISTERED_RIDERS_URL);
}

export function getAllRiders(): Promise<RidersResponse> {
  return post<RidersResponse>(API_GET_ALL_RIDERS_URL);
}
