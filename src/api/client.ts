import { environmentValidation } from "@/lib/env";

const rawBase = environmentValidation.ok
  ? environmentValidation.values.VITE_API_BASE_URL
  : ((import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL ?? "");

const API_BASE_URL = rawBase.replace(/\/+$/, "");

export function joinUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

class ApiError extends Error {
  readonly status: number;
  readonly responseText: string;

  constructor(status: number, responseText: string, statusText: string) {
    super(responseText || statusText || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.responseText = responseText;
  }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  body?: unknown;
}

async function request<T>(method: Method, url: string, options: RequestOptions = {}): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: "include",
  };

  if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text, response.statusText);
  }

  return (await response.json()) as T;
}

export function get<T>(url: string): Promise<T> {
  return request<T>("GET", url);
}

export function post<T>(url: string, body?: unknown): Promise<T> {
  return request<T>("POST", url, { body });
}

export function put<T>(url: string, body?: unknown): Promise<T> {
  return request<T>("PUT", url, { body });
}

export function del<T>(url: string): Promise<T> {
  return request<T>("DELETE", url);
}
