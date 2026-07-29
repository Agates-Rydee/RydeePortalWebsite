// MSW handlers for the riders/registration surface. Introduced when
// merging origin/main commits 181b4a9 + 3f197d2 + 2c63f6c into the
// restructured app (Checkpoint 8 merge). Handler URL comes from
// src/lib/config.ts per AGENTS.md H6.
//
// Endpoint: POST /GetAll/UnregisteredRiders
// Purpose : return every rider record the backend knows about so the
//           dashboards can compute total/active/pending counts and
//           forward the pending subset to PendingRiders.
// Contract: response shape { riders: Rider[] } where each rider has an
//           `activation_status` string field the dashboard filters on
//           (case-insensitively) for "pending".
//
// The seed below reuses the KARACHI_AREAS mock rider names from
// src/mocks/data/riders.ts pre-restructure so pending counts stay
// consistent with the (still mock-driven) PendingRiders UX. Once the
// backend contract stabilises and PendingRiders is migrated to consume
// this endpoint end-to-end (Deferred Register D18), seeds here will be
// unified with src/mocks/data/riders.ts.
import { http, HttpResponse } from "msw";
import { API_GET_UNREGISTERED_RIDERS_URL } from "@/lib/config";

interface MockUnregisteredRider {
  name: string;
  phone: string;
  activation_status: "pending" | "active";
  area?: string;
}

const seedRiders: MockUnregisteredRider[] = [
  { name: "Muhammad Imran", phone: "0312-4561234", activation_status: "pending", area: "Saddar" },
  { name: "Naveed Akhtar",  phone: "0321-9876543", activation_status: "pending", area: "Clifton" },
  { name: "Shoaib Malik",   phone: "0333-1122334", activation_status: "pending", area: "Gulshan-e-Iqbal" },
  { name: "Rizwan Ghafoor", phone: "0345-5544332", activation_status: "pending", area: "PECHS" },
  { name: "Danish Mehmood", phone: "0300-7654321", activation_status: "pending", area: "DHA Phase 6" },
  { name: "Kashif Noor",    phone: "0311-2233445", activation_status: "pending", area: "Malir" },
  { name: "Sajid Iqbal",    phone: "0322-8877665", activation_status: "pending", area: "Korangi" },
  { name: "Adnan Rasheed",  phone: "0343-3344556", activation_status: "pending", area: "Landhi" },
  // Some already-active so total > pending and the "active riders"
  // stat is non-zero in dev.
  { name: "Usman Tariq",    phone: "0300-1111111", activation_status: "active",  area: "Saddar" },
  { name: "Bilal Hussain",  phone: "0300-2222222", activation_status: "active",  area: "Clifton" },
  { name: "Zain ul Abidin", phone: "0300-3333333", activation_status: "active",  area: "Gulshan-e-Iqbal" },
];

export const ridersHandlers = [
  http.post(API_GET_UNREGISTERED_RIDERS_URL, async () => {
    return HttpResponse.json({ riders: seedRiders });
  }),
];
