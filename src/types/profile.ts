export const ROLES = ["Operator", "Customer", "Rider"] as const;
export type Role = (typeof ROLES)[number];

export interface Profile {
  role: string;
  name?: string;
  phone?: string;
  address?: string;
  dob?: string;
  area?: string;
  dateOfJoining?: string;
  rideState?: string;
  activationStatus?: string;
  totalRides?: number;
  totalDistance?: number;
  missedRides?: number;
  online?: boolean;
  currentLocation?: { lat: number; lon: number };
  rating?: number;
  lastCustomerID?: string;
}

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
