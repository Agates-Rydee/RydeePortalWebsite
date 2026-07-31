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

export type RiderStatus = "active" | "pending" | "blocked" | "offboarded";

export interface AllRidersRow {
  id: number;
  name: string;
  phone: string;
  cnic: string;
  status: RiderStatus;
  area: string;
  joinedAt: string; // ISO YYYY-MM-DD
  // Optional detail fields shown in the row-detail drawer; the drawer renders a dash when the wire omits them.
  dob?: string;
  documents?: string[];
  pin?: string;
}
