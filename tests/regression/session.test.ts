// D9 session persistence — unit tests for the sole read/write path per H7.
// Envelope shape: { v: 1, profile, savedAt }. Any drift here breaks the
// F1 loop-break across refreshes (see docs/qa/release-readiness.md §D9).
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_MAX_AGE_MS,
  SESSION_STORAGE_KEY,
  clearSession,
  loadSession,
  saveSession,
} from "@/features/auth/session";
import type { Profile } from "@/types/profile";

const rider: Profile = { role: "Rider", name: "Rida Rider" };

beforeEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
});

describe("D9 — session envelope roundtrip", () => {
  it("saveSession then loadSession returns the profile (v1 roundtrip)", () => {
    saveSession(rider);
    expect(loadSession()).toEqual(rider);
  });

  it("stores a v1 envelope shape (never a raw Profile)", () => {
    saveSession(rider);
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { v: number; profile: Profile; savedAt: number };
    expect(parsed.v).toBe(1);
    expect(parsed.profile).toEqual(rider);
    expect(typeof parsed.savedAt).toBe("number");
  });

  it("clearSession removes the storage key", () => {
    saveSession(rider);
    clearSession();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(loadSession()).toBeNull();
  });
});

describe("D9 — rejection paths (all must clear storage AND return null)", () => {
  it("TTL just BEFORE the boundary is honored (returns profile)", () => {
    const nowStore = Date.now() - (SESSION_MAX_AGE_MS - 1000); // 1s inside window
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 1, profile: rider, savedAt: nowStore }),
    );
    expect(loadSession()).toEqual(rider);
  });

  it("TTL past the boundary → null + storage cleared", () => {
    const nowStore = Date.now() - (SESSION_MAX_AGE_MS + 1000); // 1s past window
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 1, profile: rider, savedAt: nowStore }),
    );
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("corrupt JSON → null + storage cleared", () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, "{not-json");
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("wrong envelope version → null + storage cleared (forward-compat drop)", () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 2, profile: rider, savedAt: Date.now(), accessToken: "abc" }),
    );
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("missing/non-string profile.role → null + storage cleared", () => {
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 1, profile: { name: "no-role" }, savedAt: Date.now() }),
    );
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();

    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ v: 1, profile: { role: 42 }, savedAt: Date.now() }),
    );
    expect(loadSession()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it("non-object envelope (null/array/primitive) → null + cleared", () => {
    for (const bad of ["null", "42", "\"str\"", "[]"]) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, bad);
      expect(loadSession()).toBeNull();
      expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    }
  });
});
