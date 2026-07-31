import { createContext } from "react";
import type { Profile } from "@/types/profile";

export interface AuthContextValue {
  profile: Profile | null;
  login: (profile: Profile) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
