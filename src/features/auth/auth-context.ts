// AuthContext value + context object. Split out of AuthProvider.tsx so
// AuthProvider.tsx exports only React components (react-refresh
// only-export-components). Consumers should use `useAuth` from
// ./useAuth — not this context directly.
import { createContext } from "react";
import type { Profile } from "@/types/profile";

export interface AuthContextValue {
  profile: Profile | null;
  login: (profile: Profile) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
