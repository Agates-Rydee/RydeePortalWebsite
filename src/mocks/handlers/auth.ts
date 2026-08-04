import { http, HttpResponse } from "msw";
import { API_LOGIN_URL, API_REGISTER_URL } from "@/api/auth";

interface SeedUser {
  phone: string;
  password: string;
  role: string;
  name: string;
  dateOfJoining: string;
  address: string;
  dob: string;
  online: boolean;
  currentLocation: { lat: number; lon: number };
  rating: number;
  totalRides: number;
  missedRides: number;
  distanceTraveled?: number;
  area?: string;
  ratings?: number;
  lastCustomerId?: string;
}

const seed: SeedUser[] = [
  {
    phone: "0300111111",
    password: "rider",
    role: "rider",
    name: "Rida Rider",
    dateOfJoining: "2024-06-01T00:00:00.000Z",
    address: "12 Sea View Rd, Karachi",
    area: "Clifton",
    dob: "1995-03-14",
    totalRides: 128,
    missedRides: 3,
    distanceTraveled: 1420,
    online: true,
    currentLocation: { lat: 24.8607, lon: 67.0011 },
    rating: 4.7,
    ratings: 4.7,
    lastCustomerId: "cust-8821",
  },
  {
    phone: "0300222222",
    password: "admin",
    role: "admin",
    name: "Ada Admin",
    dateOfJoining: "2023-01-15T00:00:00.000Z",
    address: "1 Admin Way, Karachi",
    dob: "1988-11-02",
    totalRides: 0,
    missedRides: 0,
    online: true,
    currentLocation: { lat: 24.8607, lon: 67.0011 },
    rating: 5,
    lastCustomerId: "",
  },
  {
    phone: "0300333333",
    password: "operator",
    role: "operator",
    name: "Omar Operator",
    dateOfJoining: "2024-02-01T00:00:00.000Z",
    address: "9 Ops Ave, Karachi",
    dob: "1990-07-22",
    totalRides: 0,
    missedRides: 0,
    online: true,
    currentLocation: { lat: 24.8607, lon: 67.0011 },
    rating: 5,
    lastCustomerId: "",
  },
  {
    // H3: DO NOT DELETE — Customer seed is the unknown-role logout regression tripwire.
    phone: "0300444444",
    password: "customer",
    role: "customer",
    name: "Cara Customer",
    dateOfJoining: "2024-01-01T00:00:00.000Z",
    address: "42 Elsewhere",
    dob: "1992-01-01",
    totalRides: 0,
    missedRides: 0,
    online: false,
    currentLocation: { lat: 24.8607, lon: 67.0011 },
    rating: 0,
    lastCustomerId: "",
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
    const { role, name, dateOfJoining, address, dob, area, online, currentLocation, rating, totalRides, missedRides, distanceTraveled, ratings, lastCustomerId } = user;
    const profile = { name, dateOfJoining, address, dob, area, online, currentLocation, rating, totalRides, missedRides, distanceTraveled, ratings, lastCustomerId };
    return HttpResponse.json({ role, profile });
  }),

  http.post(API_REGISTER_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as RegisterBody;
    if (!body.password || !body.name || !body.role || !body.phone) {
      return HttpResponse.json(
        { message: "Missing required fields: phone, role, password and name" },
        { status: 400 },
      );
    }
    if (body.role === "rider" && (!body.dob || !body.address)) {
      return HttpResponse.json(
        { message: "Riders require name, dob and address" },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      message: "User profile created successfully",
      userId: `USER#${body.phone}`,
    });
  }),
];
