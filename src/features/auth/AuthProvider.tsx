// Auth context with per-browser session persistence via localStorage
// (see ./session.ts for the envelope, TTL, and validation). Rehydration
// happens in the useState lazy initializer so the first render already
// has the correct profile — protected routes never flash /login on
// refresh (D9 §"Client-side rehydrate").
//
// Persistence read/write is intentionally delegated to ./session.ts so
// that swapping in token-based auth (v2 envelope with accessToken /
// refreshToken / expiresAt) later is additive — this file does not
// change shape.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Profile } from "@/types/profile";
import { clearSession, loadSession, saveSession } from "./session";

interface AuthContextValue {
  profile: Profile | null;
  login: (profile: Profile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: runs exactly once during mount before the first
  // render's return value is committed. Guards see the rehydrated
  // profile immediately → no flash-of-login on refresh.
  const [profile, setProfile] = useState<Profile | null>(loadSession);

  const login = useCallback((next: Profile) => {
    saveSession(next);
    setProfile(next);
  }, []);

  // F1 (QA C5): PublicOnly calls logout() when it detects a stale
  // unknown-role profile. logout() MUST clear storage too, or the
  // next render would re-rehydrate the same profile and re-loop.
  const logout = useCallback(() => {
    clearSession();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ profile, login, logout }),
    [profile, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
