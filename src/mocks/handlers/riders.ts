// MSW handlers for the riders/registration surface. Introduced when
// merging origin/main commits 181b4a9 + 3f197d2 + 2c63f6c into the
// restructured app (Checkpoint 8 merge). Handler URL comes from
// src/lib/config.ts per AGENTS.md H6.
//
// Endpoint: POST /GetAll/UnregisteredRiders
// Purpose : return every rider record the backend knows about so the
//           dashboards can compute total/active/pending counts and
//           PendingRiders can render the review form.
// Contract: response shape { riders: Rider[] } where each rider has an
//           `activation_status` string field the dashboard filters on
//           (case-insensitively) for "pending". Additional fields
//           (id, dob, cnic, documents, pin) are returned to feed the
//           PendingRiders review UX (D18). The backend WIP has not
//           frozen these extra fields yet — see ADR-0003.
import { http, HttpResponse } from "msw";
import { API_GET_UNREGISTERED_RIDERS_URL } from "@/lib/config";

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

const seedRiders: MockUnregisteredRider[] = [
  { id: 1, name: "Muhammad Imran", phone: "0312-4561234", activation_status: "pending", area: "", dob: "1998-06-14", cnic: "42101-7654321-3", documents: ["CNIC Copy", "Profile Photo"], pin: "" },
  { id: 2, name: "Naveed Akhtar",  phone: "0321-9876543", activation_status: "pending", area: "", dob: "1995-11-02", cnic: "42201-1234567-1", documents: ["CNIC Copy"], pin: "" },
  { id: 3, name: "Shoaib Malik",   phone: "0333-1122334", activation_status: "pending", area: "", dob: "2000-03-25", cnic: "42301-9988776-5", documents: ["CNIC Copy", "Profile Photo", "Bike Registration"], pin: "" },
  { id: 4, name: "Rizwan Ghafoor", phone: "0345-5544332", activation_status: "pending", area: "", dob: "1993-08-19", cnic: "42101-4433221-7", documents: [], pin: "" },
  { id: 5, name: "Danish Mehmood", phone: "0300-7654321", activation_status: "pending", area: "", dob: "1997-01-30", cnic: "42401-6677889-2", documents: ["CNIC Copy", "Bike Registration"], pin: "" },
  { id: 6, name: "Kashif Noor",    phone: "0311-2233445", activation_status: "pending", area: "", dob: "2001-09-07", cnic: "42501-1122334-9", documents: ["Profile Photo"], pin: "" },
  { id: 7, name: "Sajid Iqbal",    phone: "0322-8877665", activation_status: "pending", area: "", dob: "1996-12-20", cnic: "42601-5566778-4", documents: ["CNIC Copy", "Profile Photo", "Driving License"], pin: "" },
  { id: 8, name: "Adnan Rasheed",  phone: "0343-3344556", activation_status: "pending", area: "", dob: "1999-05-11", cnic: "42101-2233445-6", documents: [], pin: "" },
  // Some already-active so total > pending and the "active riders"
  // stat is non-zero in dev. AdminDashboard filters these out.
  { id: 101, name: "Usman Tariq",    phone: "0300-1111111", activation_status: "active", area: "Saddar" },
  { id: 102, name: "Bilal Hussain",  phone: "0300-2222222", activation_status: "active", area: "Clifton" },
  { id: 103, name: "Zain ul Abidin", phone: "0300-3333333", activation_status: "active", area: "Gulshan-e-Iqbal" },
];

export const ridersHandlers = [
  http.post(API_GET_UNREGISTERED_RIDERS_URL, async () => {
    return HttpResponse.json({ riders: seedRiders });
  }),
];
