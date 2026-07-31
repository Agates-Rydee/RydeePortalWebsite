// Admin is intentionally absent from ROLES: it is not a creatable role and
// must never appear in the register-user dropdown.
export const ROLES = ["Operator", "Customer", "Rider"] as const;
export type Role = (typeof ROLES)[number];

// Fields are almost all optional: each dashboard reads a different subset and
// the backend contract is still stabilising. Keeping additions optional means
// the persisted session envelope stays compatible with older stored payloads,
// because loadSession only requires that role is present and is a string.
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
  // Read only by the rider dashboard; the admin and operator seeds omit them.
  area?: string;
  distanceTraveled?: number;
  ratings?: number;
}

// Case-insensitive so the guard layer accepts either "Admin" or "admin" from
// the backend. Any unrecognised role falls through to /login; the route guards
// pair that with a logout() call to clear the invalid session.
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
