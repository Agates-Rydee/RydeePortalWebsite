// MSW handlers for the auth surface. Endpoints are built from the same
// src/lib/config.ts constants the app fetches, so contract can't drift.
// ADR-0003 §"Contract fidelity" is authoritative.
//
// F6 fix (QA 2026-07-29): LoginPage submits `{ phone, password }`, NOT
// `{ email, password }` — verified against the byte-for-byte fetch call
// in src/features/auth/pages/LoginPage.tsx. Handlers match on phone.
// Seeds retain `email` for register-collision realism.
import { http, HttpResponse } from "msw";
import { API_LOGIN_URL, API_REGISTER_URL } from "@/lib/config";

// Per-role 10-digit memorable phone numbers. LoginPage validates
// /^\d{10}$/ before submit, so seeds must be exactly 10 digits.
const seed = [
  {
    email: "rider@example.com",
    phone: "0300111111", // Rider
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
    phone: "0300222222", // Admin
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
    phone: "0300333333", // Operator
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
    phone: "0300444444", // Customer — intentionally exercises the F1
    password: "customer",  // unknown-role logout path (Customer has no dashboard).
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

interface LoginBody { phone?: string; password?: string }
interface RegisterBody {
  name?: string; email?: string; phone?: string; dob?: string;
  address?: string; password?: string; role?: string;
}

export const authHandlers = [
  http.post(API_LOGIN_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as LoginBody;
    const user = seed.find(
      (u) => u.phone === body.phone && u.password === body.password,
    );
    if (!user) {
      return HttpResponse.text("Invalid phone or password", { status: 401 });
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
