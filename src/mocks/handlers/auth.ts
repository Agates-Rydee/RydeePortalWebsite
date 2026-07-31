import { http, HttpResponse } from "msw";
import { API_LOGIN_URL, API_REGISTER_URL } from "@/lib/config";

const seed = [
  {
    email: "rider@example.com",
    phone: "0300111111",
    password: "rider",
    profile: {
      role: "Rider",
      name: "Rida Rider",
      address: "12 Sea View Rd, Karachi",
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
    phone: "0300222222",
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
    phone: "0300333333",
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
    // Do not delete this user: logging in as Customer exercises the unknown-role logout path that guards against redirect loops.
    phone: "0300444444",
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
