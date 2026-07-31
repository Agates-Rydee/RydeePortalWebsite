import type { Profile } from "@/types/profile";

export const SESSION_VERSION = 1;

// Client-side maximum session age. Approximates a token time-to-live until the
// backend provides real access/refresh tokens; the user is force-logged-out once
// this window elapses regardless of activity.
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const SESSION_STORAGE_KEY = "rydee.session";

// Version-tagged envelope. Adding token fields in a future version is additive:
// bump the version literal, extend the interface, and older payloads that no
// longer match the shape are treated as logged-out and dropped on load.
export interface SessionEnvelopeV1 {
  v: 1;
  profile: Profile;
  savedAt: number;
}

function isEnvelopeV1(value: unknown): value is SessionEnvelopeV1 {
  if (typeof value !== "object" || value === null) return false;
  const rec = value as Record<string, unknown>;
  if (rec.v !== 1) return false;
  if (typeof rec.savedAt !== "number") return false;
  const profile = rec.profile;
  if (typeof profile !== "object" || profile === null) return false;
  // Only require that role is a string here; the route guards and roleHome
  // already tolerate unknown role values, so validating the enum here would
  // duplicate that logic and reject sessions the guards can handle safely.
  return typeof (profile as { role?: unknown }).role === "string";
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSession(): Profile | null {
  const s = storage();
  if (!s) return null;
  const raw = s.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }

  if (!isEnvelopeV1(parsed)) {
    // Every rejection path clears the stored key so subsequent mounts do not
    // re-parse the same corrupt blob on every render.
    clearSession();
    return null;
  }

  if (Date.now() - parsed.savedAt > SESSION_MAX_AGE_MS) {
    clearSession();
    return null;
  }

  return parsed.profile;
}

export function saveSession(profile: Profile): void {
  const s = storage();
  if (!s) return;
  const envelope: SessionEnvelopeV1 = {
    v: SESSION_VERSION,
    profile,
    savedAt: Date.now(),
  };
  try {
    s.setItem(SESSION_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Storage full or disabled: fall back to in-memory-only session state.
  }
}

export function clearSession(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore: nothing actionable if removeItem itself throws.
  }
}
