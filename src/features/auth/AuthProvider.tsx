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

  // Logout must also clear storage: without it, the next render would rehydrate the same profile and loop.
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
