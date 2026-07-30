// Foundation smoke — proves the msw/node harness is wired to
// src/mocks/handlers and jsdom is up. The real regression suite lives in
// tests/regression/**. If this file breaks, the setup is broken; nothing
// downstream will run correctly.
import { describe, expect, it } from "vitest";
import { API_LOGIN_URL } from "@/lib/config";

describe("test foundation (D12)", () => {
  it("boots jsdom (window + localStorage available)", () => {
    expect(typeof window).toBe("object");
    expect(typeof window.localStorage.setItem).toBe("function");
  });

  it("intercepts fetch via reused src/mocks/handlers", async () => {
    const res = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0300111111", password: "rider" }),
      credentials: "include",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { role: string };
    expect(body.role).toBe("Rider");
  });
});
