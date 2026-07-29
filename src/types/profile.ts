// User profile + role types. Extracted from src/App.tsx in Checkpoint 5
// (ADR-0001 §"Where types live" — shared by auth, dashboards, and MSW
// handlers). Field shape preserved byte-for-byte; broadening or
// tightening of individual fields is deferred (D3: `Boolean` → `boolean`).
// Preserved verbatim from pre-C5 App.tsx (git show 41d649e:src/App.tsx).
// Admin is NOT a creatable role via /admin/register. See D12 for the open
// product question.
export const ROLES = ["Operator", "Customer", "Rider"] as const;
export type Role = (typeof ROLES)[number];

// Kept as the loose shape the current backend/mock returns. Refined
// alongside D3 (Boolean→boolean, currentLocation shape review).
export interface Profile {
  role: string;
  name: string;
  address: string;
  dob: string;
  joiningDate: string;
  totalRides: number;
  missedRides: number;
  online: boolean;
  currentLocation: { lat: number; lon: number };
  rating: number;
  lastCustomerId: string;
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
