// In-memory auth context. See ADR-0002 §"Decision — AuthProvider".
// Session persistence (sessionStorage rehydrate or /me endpoint) is
// deferred (D9) — refresh = logged out, matching today's behavior.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Profile } from "@/types/profile";

interface AuthContextValue {
  profile: Profile | null;
  login: (profile: Profile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  const login = useCallback((next: Profile) => setProfile(next), []);
  const logout = useCallback(() => setProfile(null), []);

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
