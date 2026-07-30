// User profile + role types. Extracted from src/App.tsx in Checkpoint 5
// (ADR-0001 §"Where types live" — shared by auth, dashboards, and MSW
// handlers). Admin is NOT a creatable role via /admin/register — see
// AGENTS.md H2 / open item D14.
export const ROLES = ["Operator", "Customer", "Rider"] as const;
export type Role = (typeof ROLES)[number];

/**
 * Loose user profile the backend (and MSW) returns after login. Fields
 * are kept mostly optional because:
 *   - The three dashboards read different subsets.
 *   - The backend contract is still WIP (H1).
 *   - Additive widening keeps the H7 session envelope on v1: a stored v1
 *     blob validates against this shape because we only ever add
 *     optional fields (`loadSession` only requires `role: string`).
 *
 * Unified 2026-07-30 (D6/D4/D3): merged the fields RiderDashboard was
 * reading off an inline shape (`area`, `distanceTraveled`, `ratings`)
 * so we can drop the `@ts-nocheck` header and flip `strict: true`.
 * `online` is `boolean` (not the `Boolean` wrapper object — D3 closed).
 */
export interface Profile {
  role: string;
  name?: string;
  address?: string;
  dob?: string;
  joiningDate?: string;
  totalRides?: number;
  missedRides?: number;
  online?: boolean;
  currentLocation?: { lat: number; lon: number };
  rating?: number;
  lastCustomerId?: string;
  // Extra fields the RiderDashboard reads (present in MSW rider seed).
  // Optional because AdminDashboard / OperatorDashboard seeds do not
  // populate them.
  area?: string;
  distanceTraveled?: number;
  ratings?: number;
}

/**
 * Post-login destination per role. Case-insensitive to mirror the
 * existing `role.toLowerCase()` switch in the old App.tsx.
 * Unknown role → `/login` (guard layer also calls `logout()`).
 */
export function roleHome(role: string | undefined | null): string {
  switch ((role ?? "").toLowerCase()) {
    case "rider":
      return "/rider";
    case "admin":
      return "/admin";
    case "operator":
      return "/operator";
    default:
      return "/login";
  }
}
