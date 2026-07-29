// Persistence layer for the auth session. Isolated from AuthProvider so
// that adding token-based auth later (accessToken/refreshToken/expiresAt)
// is additive: bump the envelope version, extend the shape, done. See
// D-token entry in docs/design/migration-plan.md.
//
// Storage: localStorage (per user decision 2026-07-29 — session survives
// tab close and browser restart). Client-side TTL enforced as a stopgap
// until real backend token TTL exists.
import type { Profile } from "@/types/profile";

/** Bump when the envelope shape changes. Older envelopes are dropped. */
export const SESSION_VERSION = 1;

/**
 * Client-side max age. Approximates a token TTL until the backend ships
 * access/refresh tokens. Change with care — user gets logged out after
 * this many ms regardless of activity.
 */
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

/** localStorage key. Namespaced to avoid collisions on shared origins. */
export const SESSION_STORAGE_KEY = "rydee.session";

/**
 * Persisted envelope. Version-tagged so we can add token fields (v2)
 * without breaking v1 payloads — v1 will just be treated as logged out.
 */
export interface SessionEnvelopeV1 {
  v: 1;
  profile: Profile;
  savedAt: number; // epoch ms; used for SESSION_MAX_AGE_MS
}

function isEnvelopeV1(value: unknown): value is SessionEnvelopeV1 {
  if (typeof value !== "object" || value === null) return false;
  const rec = value as Record<string, unknown>;
  if (rec.v !== 1) return false;
  if (typeof rec.savedAt !== "number") return false;
  const profile = rec.profile;
  if (typeof profile !== "object" || profile === null) return false;
  // Minimal validation: role must be a string. Guards + roleHome tolerate
  // unknown values, so we don't check the enum here.
  return typeof (profile as { role?: unknown }).role === "string";
}

/** Best-effort feature detection. Non-browsers / privacy-mode → no-op. */
function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Read the persisted session. Returns null for any of:
 *   - no envelope stored
 *   - JSON parse failure
 *   - unknown envelope version
 *   - shape validation fails
 *   - envelope older than SESSION_MAX_AGE_MS
 * In every "reject" path the storage key is cleared so subsequent
 * mounts / renders don't retry the same bad blob.
 */
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
    // Unknown version or corrupt shape — drop.
    clearSession();
    return null;
  }

  if (Date.now() - parsed.savedAt > SESSION_MAX_AGE_MS) {
    // Client-side TTL exceeded — behave like a logout.
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
    // quota exceeded / disabled — degrade to in-memory only.
  }
}

export function clearSession(): void {
  const s = storage();
  if (!s) return;
  try {
    s.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
