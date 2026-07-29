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
