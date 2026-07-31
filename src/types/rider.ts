// Rider domain types. Moved from src/app/data/mockData.ts in Checkpoint 4
// (see docs/design/migration-plan.md and ADR-0001).
export type RiderState = "idle" | "arriving" | "dispatching";

export interface ActiveRider {
  id: number;
  name: string;
  lat: number;
  lng: number;
  state: RiderState;
  bike: string;
  area: string;
}

export interface PendingRider {
  id: number;
  name: string;
  phone: string;
  dob: string;
  cnic: string;
  area: string;
  documents: string[];
  pin: string;
}

// ADR-0004 — unified All Riders admin table row.
export type RiderStatus = "active" | "pending" | "blocked" | "offboarded";

export interface AllRidersRow {
  id: number;
  name: string;
  phone: string;
  cnic: string;
  status: RiderStatus;
  area: string;
  joinedAt: string; // ISO YYYY-MM-DD
  // Best-effort detail fields for the row → detail Sheet (UX spec §fast-follow).
  // May be absent when the wire omits them; the Sheet renders "—" for missing.
  dob?: string;
  documents?: string[];
  pin?: string;
}
