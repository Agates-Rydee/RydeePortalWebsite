// Auth context provider with per-browser session persistence via
// localStorage (see ./session.ts for envelope, TTL, validation).
// Rehydration happens in the useState lazy initializer so the first
// render already has the correct profile — protected routes never
// flash /login on refresh (D9 §"Client-side rehydrate").
//
// Persistence read/write is delegated to ./session.ts so a future
// v2 envelope (accessToken/refreshToken/expiresAt) is additive.
//
// AuthContext + useAuth were split into ./auth-context and ./useAuth
// so this file exports only components (react-refresh compliance).
import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { Profile } from "@/types/profile";
import { clearSession, loadSession, saveSession } from "./session";
import { AuthContext, type AuthContextValue } from "./auth-context";


export function AuthProvider({ children }: { children: ReactNode }) {
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
