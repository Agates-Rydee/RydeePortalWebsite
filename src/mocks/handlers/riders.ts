import { http, HttpResponse } from "msw";
import {
  API_GET_ALL_RIDERS_URL,
  API_GET_UNREGISTERED_RIDERS_URL,
} from "@/api/riders";

interface MockUnregisteredRider {
  id: number;
  name: string;
  phone: string;
  activation_status: "pending" | "active";
  area?: string;
  dob?: string;
  cnic?: string;
  documents?: string[];
  pin?: string;
}

const unregisteredSeeds: MockUnregisteredRider[] = [
  { id: 1, name: "Muhammad Imran", phone: "0312-4561234", activation_status: "pending", area: "", dob: "1998-06-14", cnic: "42101-7654321-3", documents: ["CNIC Copy", "Profile Photo"], pin: "" },
  { id: 2, name: "Naveed Akhtar",  phone: "0321-9876543", activation_status: "pending", area: "", dob: "1995-11-02", cnic: "42201-1234567-1", documents: ["CNIC Copy"], pin: "" },
  { id: 3, name: "Shoaib Malik",   phone: "0333-1122334", activation_status: "pending", area: "", dob: "2000-03-25", cnic: "42301-9988776-5", documents: ["CNIC Copy", "Profile Photo", "Bike Registration"], pin: "" },
  { id: 4, name: "Rizwan Ghafoor", phone: "0345-5544332", activation_status: "pending", area: "", dob: "1993-08-19", cnic: "42101-4433221-7", documents: [], pin: "" },
  { id: 5, name: "Danish Mehmood", phone: "0300-7654321", activation_status: "pending", area: "", dob: "1997-01-30", cnic: "42401-6677889-2", documents: ["CNIC Copy", "Bike Registration"], pin: "" },
  { id: 6, name: "Kashif Noor",    phone: "0311-2233445", activation_status: "pending", area: "", dob: "2001-09-07", cnic: "42501-1122334-9", documents: ["Profile Photo"], pin: "" },
  { id: 7, name: "Sajid Iqbal",    phone: "0322-8877665", activation_status: "pending", area: "", dob: "1996-12-20", cnic: "42601-5566778-4", documents: ["CNIC Copy", "Profile Photo", "Driving License"], pin: "" },
  { id: 8, name: "Adnan Rasheed",  phone: "0343-3344556", activation_status: "pending", area: "", dob: "1999-05-11", cnic: "42101-2233445-6", documents: [], pin: "" },
  { id: 101, name: "Usman Tariq",    phone: "0300-1111111", activation_status: "active", area: "Saddar" },
  { id: 102, name: "Bilal Hussain",  phone: "0300-2222222", activation_status: "active", area: "Clifton" },
  { id: 103, name: "Zain ul Abidin", phone: "0300-3333333", activation_status: "active", area: "Gulshan-e-Iqbal" },
];

// Seed rows deliberately mix wire-field aliases so the mapper is exercised end-to-end:
// one row uses `rideArea` instead of `area`, and another uses boolean `activated`
// without an `activation_status` string.
const allRidersSeeds: Array<Record<string, unknown>> = [
  { id: 201, name: "Muhammad Imran", phone: "0312-4561234", cnic: "42101-7654321-3", activation_status: "pending",    area: "DHA",             joinedAt: "2026-07-20" },
  { id: 202, name: "Alia Rehman",    phone: "0321-1234500", cnic: "42101-1111111-1", activation_status: "active",     rideArea: "Clifton",     joinedAt: "2026-07-15" },
  { id: 203, name: "Naveed Akhtar",  phone: "0321-9876543", cnic: "42201-1234567-1", activation_status: "pending",    area: "Gulshan-e-Iqbal", joinedAt: "2026-07-18" },
  { id: 204, name: "Faisal Khan",    phone: "0300-9990001", cnic: "42301-2222222-2", activated: true,                 area: "Saddar",          joinedAt: "2026-07-10" },
  { id: 205, name: "Shoaib Malik",   phone: "0333-1122334", cnic: "42301-9988776-5", activation_status: "pending",    area: "Nazimabad",       joinedAt: "2026-07-22" },
  { id: 206, name: "Rizwan Ghafoor", phone: "0345-5544332", cnic: "42101-4433221-7", activation_status: "blocked",    area: "Malir",           joinedAt: "2026-06-30" },
  { id: 207, name: "Danish Mehmood", phone: "0300-7654321", cnic: "42401-6677889-2", activation_status: "active",     area: "North Karachi",   joinedAt: "2026-07-05" },
  { id: 208, name: "Kashif Noor",    phone: "0311-2233445", cnic: "42501-1122334-9", activation_status: "offboarded", area: "Korangi",         joinedAt: "2026-05-12" },
  { id: 209, name: "Sajid Iqbal",    phone: "0322-8877665", cnic: "42601-5566778-4", activation_status: "active",     area: "Landhi",          joinedAt: "2026-07-01" },
  { id: 210, name: "Adnan Rasheed",  phone: "0343-3344556", cnic: "42101-2233445-6", activation_status: "pending",    area: "Orangi",          joinedAt: "2026-07-25" },
  { id: 211, name: "Usman Tariq",    phone: "0300-1111111", cnic: "42101-3344556-8", activation_status: "active",     area: "Saddar",          joinedAt: "2026-06-15" },
  { id: 212, name: "Bilal Hussain",  phone: "0300-2222222", cnic: "42101-4455667-9", activation_status: "blocked",    area: "Clifton",         joinedAt: "2026-06-20" },
  { id: 213, name: "Zain ul Abidin", phone: "0300-3333333", cnic: "42101-5566778-1", activation_status: "active",     area: "Gulshan-e-Iqbal", joinedAt: "2026-07-08" },
  { id: 214, name: "Hamza Sheikh",   phone: "0333-4455667", cnic: "42101-6677889-3", activation_status: "offboarded", area: "DHA",             joinedAt: "2026-05-01" },
  { id: 215, name: "Junaid Ali",     phone: "0345-7788990", cnic: "42101-7788990-4", activation_status: "active",     area: "Nazimabad",       joinedAt: "2026-07-12" },
  { id: 216, name: "Tariq Mahmood",  phone: "0311-8899001", cnic: "42101-8899001-5", activation_status: "pending",    area: "PECHS",           joinedAt: "2026-07-28" },
  { id: 217, name: "Yasir Iqbal",    phone: "0322-9900112", cnic: "42101-9900112-6", activation_status: "active",     area: "Gulistan-e-Johar",joinedAt: "2026-06-25" },
  { id: 218, name: "Salman Farooq",  phone: "0343-0011223", cnic: "42101-0011223-7", activation_status: "blocked",    area: "Malir",           joinedAt: "2026-06-05" },
];

export const ridersHandlers = [
  http.post(API_GET_UNREGISTERED_RIDERS_URL, async () => {
    return HttpResponse.json({ riders: unregisteredSeeds });
  }),
  http.post(API_GET_ALL_RIDERS_URL, async () => {
    return HttpResponse.json({ riders: allRidersSeeds });
  }),
];
