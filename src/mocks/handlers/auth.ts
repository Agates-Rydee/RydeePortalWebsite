// MSW handlers for the auth surface. Endpoints are built from the same
// src/lib/config.ts constants the app fetches, so contract can't drift.
// ADR-0003 §"Contract fidelity" is authoritative.
import { http, HttpResponse } from "msw";
import { API_LOGIN_URL, API_REGISTER_URL } from "@/lib/config";

// Seed users — one per role that has a dashboard. `Customer` is intentionally
// omitted (ADR-0002 D11 open question); a Customer login attempt succeeds and
// triggers the F1 "unknown-role logout" path so the fix is exercisable.
const seed = [
  {
    email: "rider@example.com",
    password: "rider",
    profile: {
      role: "Rider",
      name: "Rida Rider",
      address: "12 Sea View Rd, Karachi",
      // RiderDashboard reads these three despite them not being on the canonical
      // Profile interface (D6). Include so the dashboard renders correctly.
      area: "Clifton",
      dob: "1995-03-14",
      joiningDate: "2024-06-01",
      totalRides: 128,
      missedRides: 3,
      distanceTraveled: 1420,
      online: true,
      currentLocation: { lat: 24.8607, lon: 67.0011 },
      rating: 4.7,
      ratings: 4.7,
      lastCustomerId: "cust-8821",
    },
  },
  {
    email: "admin@example.com",
    password: "admin",
    profile: {
      role: "Admin",
      name: "Ada Admin",
      address: "1 Admin Way, Karachi",
      dob: "1988-11-02",
      joiningDate: "2023-01-15",
      totalRides: 0,
      missedRides: 0,
      online: true,
      currentLocation: { lat: 24.8607, lon: 67.0011 },
      rating: 5,
      lastCustomerId: "",
    },
  },
  {
    email: "operator@example.com",
    password: "operator",
    profile: {
      role: "Operator",
      name: "Omar Operator",
      address: "9 Ops Ave, Karachi",
      dob: "1990-07-22",
      joiningDate: "2024-02-01",
      totalRides: 0,
      missedRides: 0,
      online: true,
      currentLocation: { lat: 24.8607, lon: 67.0011 },
      rating: 5,
      lastCustomerId: "",
    },
  },
  {
    email: "customer@example.com",
    password: "customer",
    profile: {
      role: "Customer",
      name: "Cara Customer",
      address: "42 Elsewhere",
      dob: "1992-01-01",
      joiningDate: "2024-01-01",
      totalRides: 0,
      missedRides: 0,
      online: false,
      currentLocation: { lat: 24.8607, lon: 67.0011 },
      rating: 0,
      lastCustomerId: "",
    },
  },
];

interface LoginBody { email?: string; password?: string }
interface RegisterBody {
  name?: string; email?: string; phoneNumber?: string; dob?: string;
  address?: string; password?: string; role?: string;
}

export const authHandlers = [
  http.post(API_LOGIN_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as LoginBody;
    const user = seed.find(
      (u) => u.email === body.email && u.password === body.password,
    );
    if (!user) {
      return HttpResponse.text("Invalid email or password", { status: 401 });
    }
    return HttpResponse.json({ role: user.profile.role, profile: user.profile });
  }),

  http.post(API_REGISTER_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as RegisterBody;
    if (!body.email || !body.password || !body.name || !body.role) {
      return HttpResponse.text("Missing required fields", { status: 400 });
    }
    return HttpResponse.json({ ok: true, email: body.email, role: body.role });
  }),
];
