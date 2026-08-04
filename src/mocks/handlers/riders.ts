import { http, HttpResponse } from "msw";
import {
  API_ACTIVATE_RIDER_URL,
  API_GET_ALL_RIDERS_URL,
  API_GET_UNREGISTERED_RIDERS_URL,
  API_UPDATE_USER_URL,
} from "@/api/riders";

interface RiderProfile {
  name: string;
  phone: string;
  area?: string;
  address?: string;
  rideState?: string;
  dateOfJoining?: string;
  dob?: string;
  activationStatus?: "pending" | "active" | "blocked" | "offboarded";
  activation_status?: "pending" | "active" | "blocked" | "offboarded";
  totalRides?: number;
  totalDistance?: number;
  missedRides?: number;
  online?: boolean;
  currentLocation?: { lat: number; lon: number };
  rating?: number;
  lastCustomerID?: string;
  cnic?: string;
  documents?: string[];
  pin?: string;
  joinedAt?: string;
  id?: number;
  rideArea?: string;
  activated?: boolean;
}

interface RiderEnvelope {
  role: "rider";
  profile: RiderProfile;
}

function envelope(profile: RiderProfile): RiderEnvelope {
  return { role: "rider", profile };
}

const commonLoc = { lat: 42.485772350201664, lon: -70.89848771426291 };

const inactiveSeeds: RiderProfile[] = [
  {
    id: 1,
    name: "Muhammad Imran",
    phone: "0312-4561234",
    activationStatus: "pending",
    area: "un-assigned",
    dob: "1998-06-14",
    cnic: "42101-7654321-3",
    documents: ["CNIC Copy", "Profile Photo"],
    pin: "",
    address: "House#100, Sultan road",
    rideState: "Invalid",
    dateOfJoining: "2026-07-31T02:57:31.455Z",
    totalRides: 0,
    totalDistance: 0,
    missedRides: 0,
    online: false,
    currentLocation: commonLoc,
    rating: 0,
    lastCustomerID: "1234",
  },
  {
    id: 2,
    name: "Naveed Akhtar",
    phone: "0321-9876543",
    activationStatus: "pending",
    area: "un-assigned",
    dob: "1995-11-02",
    cnic: "42201-1234567-1",
    documents: ["CNIC Copy"],
    pin: "",
    address: "73 Nason Rd",
    rideState: "Invalid",
    dateOfJoining: "2026-07-31T01:18:14.284Z",
    totalRides: 0,
    totalDistance: 0,
    missedRides: 0,
    online: false,
    currentLocation: commonLoc,
    rating: 0,
    lastCustomerID: "1234",
  },
  {
    id: 3,
    name: "Shoaib Malik",
    phone: "0333-1122334",
    activationStatus: "pending",
    area: "un-assigned",
    dob: "2000-03-25",
    cnic: "42301-9988776-5",
    documents: ["CNIC Copy", "Profile Photo", "Bike Registration"],
    pin: "",
  },
  {
    id: 4,
    name: "Rizwan Ghafoor",
    phone: "0345-5544332",
    activationStatus: "pending",
    area: "un-assigned",
    dob: "1993-08-19",
    cnic: "42101-4433221-7",
    documents: [],
    pin: "",
  },
  {
    id: 5,
    name: "Danish Mehmood",
    phone: "0300-7654321",
    activationStatus: "pending",
    area: "un-assigned",
    dob: "1997-01-30",
    cnic: "42401-6677889-2",
    documents: ["CNIC Copy", "Bike Registration"],
    pin: "",
  },
  {
    id: 6,
    name: "Kashif Noor",
    phone: "0311-2233445",
    activationStatus: "pending",
    area: "un-assigned",
    dob: "2001-09-07",
    cnic: "42501-1122334-9",
    documents: ["Profile Photo"],
    pin: "",
  },
  {
    id: 7,
    name: "Sajid Iqbal",
    phone: "0322-8877665",
    activationStatus: "pending",
    area: "un-assigned",
    dob: "1996-12-20",
    cnic: "42601-5566778-4",
    documents: ["CNIC Copy", "Profile Photo", "Driving License"],
    pin: "",
  },
  {
    id: 8,
    name: "Adnan Rasheed",
    phone: "0343-3344556",
    activationStatus: "pending",
    area: "un-assigned",
    dob: "1999-05-11",
    cnic: "42101-2233445-6",
    documents: [],
    pin: "",
  },
  {
    id: 101,
    name: "Usman Tariq",
    phone: "0300-1111111",
    activationStatus: "active",
    area: "Saddar",
  },
  {
    id: 102,
    name: "Bilal Hussain",
    phone: "0300-2222222",
    activationStatus: "active",
    area: "Clifton",
  },
  {
    id: 103,
    name: "Zain ul Abidin",
    phone: "0300-3333333",
    activationStatus: "active",
    area: "Gulshan-e-Iqbal",
  },
];

// Seeds mix wire-field aliases so the mapper is exercised end-to-end.
const allRidersSeeds: RiderProfile[] = [
  {
    id: 201,
    name: "Muhammad Imran",
    phone: "0312-4561234",
    cnic: "42101-7654321-3",
    activationStatus: "pending",
    area: "DHA",
    joinedAt: "2026-07-20",
  },
  {
    id: 202,
    name: "Alia Rehman",
    phone: "0321-1234500",
    cnic: "42101-1111111-1",
    activationStatus: "active",
    rideArea: "Clifton",
    joinedAt: "2026-07-15",
  },
  {
    id: 203,
    name: "Naveed Akhtar",
    phone: "0321-9876543",
    cnic: "42201-1234567-1",
    activationStatus: "pending",
    area: "Gulshan-e-Iqbal",
    joinedAt: "2026-07-18",
  },
  {
    id: 204,
    name: "Faisal Khan",
    phone: "0300-9990001",
    cnic: "42301-2222222-2",
    activated: true,
    area: "Saddar",
    joinedAt: "2026-07-10",
  },
  {
    id: 205,
    name: "Shoaib Malik",
    phone: "0333-1122334",
    cnic: "42301-9988776-5",
    activationStatus: "pending",
    area: "Nazimabad",
    joinedAt: "2026-07-22",
  },
  {
    id: 206,
    name: "Rizwan Ghafoor",
    phone: "0345-5544332",
    cnic: "42101-4433221-7",
    activationStatus: "blocked",
    area: "Malir",
    joinedAt: "2026-06-30",
  },
  {
    id: 207,
    name: "Danish Mehmood",
    phone: "0300-7654321",
    cnic: "42401-6677889-2",
    activationStatus: "active",
    area: "North Karachi",
    joinedAt: "2026-07-05",
  },
  {
    id: 208,
    name: "Kashif Noor",
    phone: "0311-2233445",
    cnic: "42501-1122334-9",
    activationStatus: "offboarded",
    area: "Korangi",
    joinedAt: "2026-05-12",
  },
  {
    id: 209,
    name: "Sajid Iqbal",
    phone: "0322-8877665",
    cnic: "42601-5566778-4",
    activationStatus: "active",
    area: "Landhi",
    joinedAt: "2026-07-01",
  },
  {
    id: 210,
    name: "Adnan Rasheed",
    phone: "0343-3344556",
    cnic: "42101-2233445-6",
    activationStatus: "pending",
    area: "Orangi",
    joinedAt: "2026-07-25",
  },
  {
    id: 211,
    name: "Usman Tariq",
    phone: "0300-1111111",
    cnic: "42101-3344556-8",
    activationStatus: "active",
    area: "Saddar",
    joinedAt: "2026-06-15",
  },
  {
    id: 212,
    name: "Bilal Hussain",
    phone: "0300-2222222",
    cnic: "42101-4455667-9",
    activationStatus: "blocked",
    area: "Clifton",
    joinedAt: "2026-06-20",
  },
  {
    id: 213,
    name: "Zain ul Abidin",
    phone: "0300-3333333",
    cnic: "42101-5566778-1",
    activationStatus: "active",
    area: "Gulshan-e-Iqbal",
    joinedAt: "2026-07-08",
  },
  {
    id: 214,
    name: "Hamza Sheikh",
    phone: "0333-4455667",
    cnic: "42101-6677889-3",
    activationStatus: "offboarded",
    area: "DHA",
    joinedAt: "2026-05-01",
  },
  {
    id: 215,
    name: "Junaid Ali",
    phone: "0345-7788990",
    cnic: "42101-7788990-4",
    activationStatus: "active",
    area: "Nazimabad",
    joinedAt: "2026-07-12",
  },
  {
    id: 216,
    name: "Tariq Mahmood",
    phone: "0311-8899001",
    cnic: "42101-8899001-5",
    activationStatus: "pending",
    area: "PECHS",
    joinedAt: "2026-07-28",
  },
  {
    id: 217,
    name: "Yasir Iqbal",
    phone: "0322-9900112",
    cnic: "42101-9900112-6",
    activationStatus: "active",
    area: "Gulistan-e-Johar",
    joinedAt: "2026-06-25",
  },
  {
    id: 218,
    name: "Salman Farooq",
    phone: "0343-0011223",
    cnic: "42101-0011223-7",
    activationStatus: "blocked",
    area: "Malir",
    joinedAt: "2026-06-05",
  },
];

interface ActivateBody {
  phone?: string;
  pin?: string;
}

function normalisePhone(v: string): string {
  return v.replace(/\D/g, "");
}

export const ridersHandlers = [
  http.post(API_GET_UNREGISTERED_RIDERS_URL, async () => {
    return HttpResponse.json({ riders: inactiveSeeds.map(envelope) });
  }),
  http.post(API_GET_ALL_RIDERS_URL, async () => {
    return HttpResponse.json({ riders: allRidersSeeds.map(envelope) });
  }),
  http.post(API_ACTIVATE_RIDER_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as ActivateBody;
    const phone = typeof body.phone === "string" ? normalisePhone(body.phone) : "";
    const pin = typeof body.pin === "string" ? body.pin : "";
    if (!phone || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return HttpResponse.json(
        { success: false, error: "phone and 6-digit pin are required" },
        { status: 400 },
      );
    }
    const inSeed = inactiveSeeds.find((s) => normalisePhone(s.phone) === phone);
    const inAll = allRidersSeeds.find((s) => normalisePhone(s.phone) === phone);
    if (!inSeed && !inAll) {
      return HttpResponse.json(
        { success: false, error: "User profile does not exist!" },
        { status: 404 },
      );
    }
    if (inSeed) {
      inSeed.activationStatus = "active";
      inSeed.pin = pin;
    }
    if (inAll) {
      inAll.activationStatus = "active";
      inAll.pin = pin;
    }
    return HttpResponse.json({
      success: true,
      message: "User profile activated and PIN set successfully",
      updatedFields: { activation_status: "active" },
    });
  }),
  http.post(API_UPDATE_USER_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const phone = typeof body.phone === "string" ? body.phone : "";
    const role = typeof body.role === "string" ? body.role : "";
    if (!phone || !role) {
      return HttpResponse.json(
        { message: "Missing required identifier fields: phone, role" },
        { status: 400 },
      );
    }
    const key = normalisePhone(phone);
    const patch = { ...body };
    delete patch.phone;
    delete patch.role;
    const targets = [
      ...inactiveSeeds.filter((s) => normalisePhone(s.phone) === key),
      ...allRidersSeeds.filter((s) => normalisePhone(s.phone) === key),
    ];
    for (const target of targets) {
      Object.assign(target, patch);
    }
    return HttpResponse.json({
      message: "User profile patched successfully",
      updatedFields: patch,
    });
  }),
];
