import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { joinUrl, post } from "@/api/client";
import { API_LOGIN_URL } from "@/api/auth";

type FetchArgs = Parameters<typeof fetch>;

interface CapturedCall {
  url: string;
  init: RequestInit | undefined;
}

function installFetch(response: Response): CapturedCall {
  const captured: CapturedCall = { url: "", init: undefined };
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async (...args: FetchArgs) => {
      captured.url = String(args[0]);
      captured.init = args[1];
      return response;
    },
  );
  return captured;
}

describe("API client — client.ts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("base URL handling", () => {
    it("joinUrl composes the base with a leading-slash path (no double separator)", () => {
      const composed = joinUrl("/foo");
      expect(composed.endsWith("/foo")).toBe(true);
      expect(composed).not.toMatch(/\/\/foo$/);
    });

    it("composed feature URLs have no double separator before the path", () => {
      expect(API_LOGIN_URL).not.toMatch(/[^:]\/\/user-login$/);
      expect(API_LOGIN_URL.endsWith("/user-login")).toBe(true);
    });
  });

  describe("credentials", () => {
    it("always sends credentials: include (POST with body)", async () => {
      const captured = installFetch(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      await post<{ ok: boolean }>(joinUrl("/x"), { a: 1 });
      expect(captured.init?.credentials).toBe("include");
    });

    it("always sends credentials: include (empty-body POST)", async () => {
      const captured = installFetch(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      await post<{ ok: boolean }>(joinUrl("/y"));
      expect(captured.init?.credentials).toBe("include");
    });
  });

  describe("empty-body POST (riders endpoints)", () => {
    it("sends no Content-Type header and no body when the body argument is omitted", async () => {
      const captured = installFetch(
        new Response(JSON.stringify({ riders: [] }), { status: 200 }),
      );
      await post(joinUrl("/get-all-riders"));
      expect(captured.init?.body).toBeUndefined();
      const headers = captured.init?.headers as Record<string, string> | undefined;
      expect(headers).toBeUndefined();
      expect(captured.init?.method).toBe("POST");
    });
  });

  describe("JSON body serialisation", () => {
    it("serialises the body and sets Content-Type application/json", async () => {
      const captured = installFetch(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      await post(joinUrl("/user-login"), { phone: "0300111111", password: "x" });
      expect(captured.init?.body).toBe(
        JSON.stringify({ phone: "0300111111", password: "x" }),
      );
      const headers = captured.init?.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBe("application/json");
    });
  });

  describe("non-ok response", () => {
    it("throws an ApiError-shaped error with the status and verbatim response text", async () => {
      installFetch(
        new Response("Invalid phone or password", {
          status: 401,
          statusText: "Unauthorized",
        }),
      );
      await expect(post(joinUrl("/user-login"), { a: 1 })).rejects.toMatchObject({
        name: "ApiError",
        status: 401,
        responseText: "Invalid phone or password",
        message: "Invalid phone or password",
      });
    });

    it("falls back to statusText when the server text is empty", async () => {
      installFetch(new Response("", { status: 500, statusText: "Server Error" }));
      try {
        await post(joinUrl("/x"));
        throw new Error("should have thrown");
      } catch (err) {
        const e = err as { name: string; status: number; responseText: string; message: string };
        expect(e.name).toBe("ApiError");
        expect(e.status).toBe(500);
        expect(e.responseText).toBe("");
        expect(e.message).toBe("Server Error");
      }
    });
  });
});
