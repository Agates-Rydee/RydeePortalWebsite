import { http, HttpResponse } from "msw";
import {
  API_GET_RIDES_URL,
  API_GET_RIDE_URL,
  API_GET_RIDES_SUMMARY_URL,
  type Ride,
  type RideSortDir,
  type RideSortKey,
  type RideStatus,
  type RideTab,
  type RidesCounts,
} from "@/api/rides";

const LIVE_STATUSES: RideStatus[] = [
  "going_to_pick",
  "waiting_for_ride",
  "in_transit",
  "arrived",
];

const HEX = "0123456789ABCDEF";
function rid(seed: number): string {
  let out = "R-";
  let n = seed * 2654435761;
  for (let i = 0; i < 6; i++) {
    n = (n ^ (n >>> 13)) * 1274126177;
    out += HEX[(n >>> (i * 3)) & 0xf];
  }
  return out;
}

function iso(minutesAgo: number): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

function isoAhead(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function pkr(amount: number): { amount: number; currency: string } {
  return { amount, currency: "PKR" };
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function pathLenKm(path: Array<[number, number]>): number {
  let d = 0;
  for (let i = 1; i < path.length; i++) d += haversineKm(path[i - 1], path[i]);
  return Number(d.toFixed(2));
}

function makePolyline(
  pLat: number,
  pLng: number,
  dLat: number,
  dLng: number,
  seed: number,
  steps = 14,
): Array<[number, number]> {
  const path: Array<[number, number]> = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const lat = pLat + (dLat - pLat) * t + Math.sin(t * Math.PI * 2 + seed) * 0.004;
    const lng = pLng + (dLng - pLng) * t + Math.cos(t * Math.PI * 2 + seed) * 0.005;
    path.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }
  return path;
}

interface LiveSeed {
  seed: number;
  rideId: string;
  status: RideStatus;
  rider: Ride["rider"];
  customer: Ride["customer"];
  pickup: Ride["pickup"];
  dropoff: Ride["dropoff"];
  startedAt: string;
  fare: Ride["fare"];
  riderLocation?: Ride["riderLocation"];
  eta?: Ride["eta"];
  waitingMinutes?: number;
  omitRoute?: boolean;
}

const LIVE_SEEDS: LiveSeed[] = [
  {
    seed: 1,
    rideId: rid(1),
    status: "going_to_pick",
    rider: { name: "Ahmed Khan", phone: "0301-1112221" },
    customer: { name: "Ali Raza", phone: "0300-4441111" },
    pickup: { label: "Gulshan-e-Iqbal Block 6", lat: 24.9215, lng: 67.0897 },
    dropoff: { label: "Saddar Empress Market", lat: 24.8607, lng: 67.0011 },
    startedAt: iso(4),
    fare: pkr(420),
    riderLocation: { lat: 24.915, lng: 67.085, updatedAt: iso(0.2) },
    eta: { minutes: 8, distanceKm: 3.2 },
  },
  {
    seed: 2,
    rideId: rid(2),
    status: "waiting_for_ride",
    rider: { name: "Usman Tariq", phone: "0300-1111111" },
    customer: { name: "Fatima Noor", phone: "0333-2223334" },
    pickup: { label: "Clifton Block 2", lat: 24.8157, lng: 67.0235 },
    dropoff: { label: "DHA Phase 6", lat: 24.7936, lng: 67.0715 },
    startedAt: iso(2),
    fare: pkr(550),
    riderLocation: { lat: 24.816, lng: 67.024, updatedAt: iso(0.3) },
    eta: { minutes: 3, distanceKm: 0.5 },
  },
  {
    seed: 3,
    rideId: rid(3),
    status: "in_transit",
    rider: { name: "Bilal Hussain", phone: "0300-2222222" },
    customer: { name: "Sara Ahmed", phone: "0345-9998887" },
    pickup: { label: "Nazimabad No. 3", lat: 24.9105, lng: 67.0345 },
    dropoff: { label: "II Chundrigar Road", lat: 24.8517, lng: 67.0116 },
    startedAt: iso(22),
    fare: pkr(380),
    riderLocation: { lat: 24.885, lng: 67.02, updatedAt: iso(0.1) },
    eta: { minutes: 6, distanceKm: 2.1 },
    waitingMinutes: 3,
  },
  {
    seed: 4,
    rideId: rid(4),
    status: "in_transit",
    rider: { name: "Zain ul Abidin", phone: "0300-3333333" },
    customer: { name: "Hina Malik", phone: "0311-5556667" },
    pickup: { label: "PECHS Block 2", lat: 24.8735, lng: 67.06 },
    dropoff: { label: "Karachi Airport", lat: 24.9008, lng: 67.1681 },
    startedAt: iso(14),
    fare: pkr(720),
    riderLocation: { lat: 24.885, lng: 67.11, updatedAt: iso(0.15) },
    eta: { minutes: 12, distanceKm: 6.4 },
    waitingMinutes: 5,
  },
  {
    seed: 5,
    rideId: rid(5),
    status: "arrived",
    rider: { name: "Junaid Ali", phone: "0345-7788990" },
    customer: { name: "Rabia Sheikh", phone: "0322-3334445" },
    pickup: { label: "Nazimabad No. 1", lat: 24.9, lng: 67.03 },
    dropoff: { label: "Federal B Area", lat: 24.93, lng: 67.06 },
    startedAt: iso(28),
    fare: pkr(310),
    riderLocation: { lat: 24.93, lng: 67.06, updatedAt: iso(0.05) },
    eta: { minutes: 0, distanceKm: 0 },
    waitingMinutes: 4,
  },
  {
    seed: 6,
    rideId: rid(6),
    status: "going_to_pick",
    rider: { name: "Yasir Iqbal", phone: "0322-9900112" },
    customer: { name: "Nida Rehman", phone: "0300-7776665" },
    pickup: { label: "Gulistan-e-Johar Block 15", lat: 24.9204, lng: 67.13 },
    dropoff: { label: "Tariq Road", lat: 24.87, lng: 67.06 },
    startedAt: iso(6),
    fare: pkr(490),
    riderLocation: { lat: 24.918, lng: 67.128, updatedAt: iso(0.4) },
    eta: { minutes: 10, distanceKm: 4.7 },
  },
  {
    seed: 7,
    rideId: rid(7),
    status: "waiting_for_ride",
    rider: { name: "Kashif Noor", phone: "0311-2233445" },
    customer: { name: "Imran Farooq", phone: "0333-4445556" },
    pickup: { label: "Korangi Sector 4", lat: 24.82, lng: 67.13 },
    dropoff: { label: "Landhi Industrial Area", lat: 24.85, lng: 67.19 },
    startedAt: iso(11),
    fare: pkr(400),
    riderLocation: { lat: 24.82, lng: 67.13, updatedAt: iso(5.2) },
    eta: { minutes: 4, distanceKm: 1.2 },
    omitRoute: true,
  },
  {
    seed: 8,
    rideId: rid(8),
    status: "in_transit",
    rider: { name: "Sajid Iqbal", phone: "0322-8877665" },
    customer: { name: "Zara Khan", phone: "0300-1113332" },
    pickup: { label: "North Karachi Sector 5", lat: 24.98, lng: 67.06 },
    dropoff: { label: "Shahrah-e-Faisal", lat: 24.87, lng: 67.07 },
    startedAt: iso(9),
    fare: pkr(560),
    riderLocation: { lat: 24.94, lng: 67.065, updatedAt: iso(0.1) },
    eta: { minutes: 7, distanceKm: 3.0 },
    waitingMinutes: 2,
  },
  {
    seed: 9,
    rideId: rid(9),
    status: "going_to_pick",
    rider: { name: "Adnan Rasheed", phone: "0343-3344556" },
    customer: { name: "Bushra Anwar", phone: "0311-9990001" },
    pickup: { label: "Malir Cantt", lat: 24.89, lng: 67.2 },
    dropoff: { label: "Defence Phase 5", lat: 24.803, lng: 67.062 },
    startedAt: iso(3),
    fare: pkr(680),
    riderLocation: { lat: 24.89, lng: 67.198, updatedAt: iso(0.2) },
    eta: { minutes: 14, distanceKm: 7.8 },
  },
];

function buildLive(s: LiveSeed): Ride {
  const path = makePolyline(s.pickup.lat, s.pickup.lng, s.dropoff.lat, s.dropoff.lng, s.seed);
  const plannedDistanceKm = pathLenKm(path);
  const ride: Ride = {
    rideId: s.rideId,
    status: s.status,
    rider: s.rider,
    customer: s.customer,
    pickup: s.pickup,
    dropoff: s.dropoff,
    startedAt: s.startedAt,
    fare: s.fare,
    riderLocation: s.riderLocation,
    eta: s.eta,
    plannedDistanceKm,
  };
  if (s.waitingMinutes !== undefined) ride.waitingMinutes = s.waitingMinutes;
  if (!s.omitRoute) ride.routePolyline = JSON.stringify(path);
  return ride;
}

interface UpcomingSeed {
  seed: number;
  rideId: string;
  rider: Ride["rider"];
  customer: Ride["customer"];
  pickup: Ride["pickup"];
  dropoff: Ride["dropoff"];
  scheduledAt: string;
  fare: Ride["fare"];
}

const UPCOMING_SEEDS: UpcomingSeed[] = [
  {
    seed: 20,
    rideId: rid(20),
    rider: { name: "Danish Mehmood", phone: "0300-7654321" },
    customer: { name: "Owais Siddiqui", phone: "0345-1112223" },
    pickup: { label: "Gulshan-e-Iqbal Block 10", lat: 24.9155, lng: 67.0921 },
    dropoff: { label: "Jinnah International Airport", lat: 24.9008, lng: 67.1681 },
    scheduledAt: isoAhead(35),
    fare: pkr(750),
  },
  {
    seed: 21,
    rideId: rid(21),
    rider: { name: "Hamza Sheikh", phone: "0333-4455667" },
    customer: { name: "Anum Javed", phone: "0300-8887776" },
    pickup: { label: "DHA Phase 4", lat: 24.797, lng: 67.049 },
    dropoff: { label: "Clifton Beach", lat: 24.797, lng: 66.998 },
    scheduledAt: isoAhead(75),
    fare: pkr(310),
  },
  {
    seed: 22,
    rideId: rid(22),
    rider: { name: "Salman Farooq", phone: "0343-0011223" },
    customer: { name: "Kiran Aslam", phone: "0322-5556667" },
    pickup: { label: "PECHS Block 6", lat: 24.87, lng: 67.068 },
    dropoff: { label: "Saddar", lat: 24.86, lng: 67.001 },
    scheduledAt: isoAhead(110),
    fare: pkr(280),
  },
];

function buildUpcoming(s: UpcomingSeed): Ride {
  const path = makePolyline(s.pickup.lat, s.pickup.lng, s.dropoff.lat, s.dropoff.lng, s.seed);
  return {
    rideId: s.rideId,
    status: "scheduled",
    rider: s.rider,
    customer: s.customer,
    pickup: s.pickup,
    dropoff: s.dropoff,
    scheduledAt: s.scheduledAt,
    fare: s.fare,
    routePolyline: JSON.stringify(path),
    plannedDistanceKm: pathLenKm(path),
  };
}

const COMPLETED_RIDES: Ride[] = Array.from({ length: 10 }, (_, i): Ride => {
  const dur = 15 + i * 3;
  const pLat = 24.92 + (i % 3) * 0.01;
  const pLng = 67.09 + (i % 4) * 0.008;
  const dLat = 24.86 - (i % 3) * 0.005;
  const dLng = 67.001 + (i % 5) * 0.01;
  const path = makePolyline(pLat, pLng, dLat, dLng, 40 + i);
  const traveledKm = pathLenKm(path);
  const pickupLabels = ["Gulshan Block 2", "Saddar", "DHA Phase 6", "Clifton Block 5", "PECHS Block 6"];
  return {
    rideId: rid(40 + i),
    status: "completed",
    rider: { name: `Rider ${i + 1}`, phone: `0300-100000${i}` },
    customer: { name: `Customer ${i + 1}`, phone: `0345-200000${i}` },
    pickup: { label: pickupLabels[i % pickupLabels.length], lat: pLat, lng: pLng },
    dropoff: { label: "Saddar", lat: dLat, lng: dLng },
    startedAt: iso(60 + i * 20 + dur + 60 * 24 * (i % 7) + (i >= 4 ? 60 * 24 * 30 * (i - 3) : 0)),
    completedAt: iso(60 + i * 20 + 60 * 24 * (i % 7) + (i >= 4 ? 60 * 24 * 30 * (i - 3) : 0)),
    fare: pkr(300 + i * 25),
    traveledPath: JSON.stringify(path),
    routePolyline: JSON.stringify(path),
    plannedDistanceKm: traveledKm,
    traveledDistanceKm: Number((traveledKm * (0.98 + (i % 5) * 0.01)).toFixed(2)),
    waitingMinutes: (i * 2) % 11,
  };
});

const CANCELED_RIDES: Ride[] = [
  {
    rideId: rid(70),
    status: "canceled",
    rider: { name: "Tariq Mahmood", phone: "0311-8899001" },
    customer: { name: "Sana Iftikhar", phone: "0333-1231231" },
    pickup: { label: "Nazimabad No. 4", lat: 24.91, lng: 67.035 },
    dropoff: { label: "Gulistan-e-Johar", lat: 24.92, lng: 67.13 },
    canceledAt: iso(45),
    canceledBy: "rider",
    cancelReason: "Vehicle breakdown",
    fare: pkr(0),
  },
  {
    rideId: rid(71),
    status: "canceled",
    rider: { name: "Faisal Khan", phone: "0300-9990001" },
    customer: { name: "Ayesha Malik", phone: "0311-2223334" },
    pickup: { label: "Clifton Block 5", lat: 24.812, lng: 67.03 },
    dropoff: { label: "DHA Phase 8", lat: 24.79, lng: 67.08 },
    canceledAt: iso(60 * 24 * 32),
    canceledBy: "customer",
    cancelReason: "Changed plans",
    fare: pkr(0),
  },
  {
    rideId: rid(72),
    status: "canceled",
    rider: { name: "Rizwan Ghafoor", phone: "0345-5544332" },
    customer: { name: "Mehwish Zafar", phone: "0322-9998887" },
    pickup: { label: "Korangi", lat: 24.82, lng: 67.14 },
    dropoff: { label: "Saddar", lat: 24.86, lng: 67.001 },
    canceledAt: iso(60 * 24 * 68),
    canceledBy: "customer",
    cancelReason: "Long wait",
    fare: pkr(0),
  },
  {
    rideId: rid(73),
    status: "canceled",
    rider: { name: "Naveed Akhtar", phone: "0321-9876543" },
    customer: { name: "Faryal Sultana", phone: "0343-1114442" },
    pickup: { label: "North Nazimabad", lat: 24.95, lng: 67.03 },
    dropoff: { label: "II Chundrigar Road", lat: 24.85, lng: 67.011 },
    canceledAt: iso(60 * 24 * 130),
    canceledBy: "rider",
    cancelReason: "Traffic",
    fare: pkr(0),
  },
];

const RIDES: Ride[] = [
  ...LIVE_SEEDS.map(buildLive),
  ...UPCOMING_SEEDS.map(buildUpcoming),
  ...COMPLETED_RIDES,
  ...CANCELED_RIDES,
];

function jitterLocation(r: Ride): Ride {
  if (!r.riderLocation) return r;
  const d = 0.0006;
  return {
    ...r,
    riderLocation: {
      lat: r.riderLocation.lat + (Math.random() - 0.5) * d,
      lng: r.riderLocation.lng + (Math.random() - 0.5) * d,
      updatedAt: r.riderLocation.updatedAt,
    },
  };
}

function ridesForTab(tab: RideTab): Ride[] {
  if (tab === "live") return RIDES.filter((r) => LIVE_STATUSES.includes(r.status));
  if (tab === "upcoming") return RIDES.filter((r) => r.status === "scheduled");
  if (tab === "completed") return RIDES.filter((r) => r.status === "completed");
  return RIDES.filter((r) => r.status === "canceled");
}

function computeCounts(): RidesCounts {
  return {
    live: RIDES.filter((r) => LIVE_STATUSES.includes(r.status)).length,
    upcoming: RIDES.filter((r) => r.status === "scheduled").length,
    completed: RIDES.filter((r) => r.status === "completed").length,
    canceled: RIDES.filter((r) => r.status === "canceled").length,
  };
}

interface GetRidesBody {
  tab?: unknown;
  page?: unknown;
  pageSize?: unknown;
  sortBy?: unknown;
  sortDir?: unknown;
}

function isTab(v: unknown): v is RideTab {
  return v === "live" || v === "upcoming" || v === "completed" || v === "canceled";
}

const SORT_KEYS: readonly RideSortKey[] = [
  "rideId",
  "status",
  "riderName",
  "customerName",
  "pickupLabel",
  "dropoffLabel",
  "fareAmount",
  "startedAt",
  "scheduledAt",
  "completedAt",
  "duration",
  "canceledAt",
  "canceledBy",
];

function isSortKey(v: unknown): v is RideSortKey {
  return typeof v === "string" && (SORT_KEYS as readonly string[]).includes(v);
}

function isSortDir(v: unknown): v is RideSortDir {
  return v === "asc" || v === "desc";
}

function tsOr(iso: string | undefined): number {
  if (!iso) return Number.NaN;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? Number.NaN : t;
}

function cmpNum(a: number, b: number): number {
  const aNaN = Number.isNaN(a);
  const bNaN = Number.isNaN(b);
  if (aNaN && bNaN) return 0;
  if (aNaN) return 1;
  if (bNaN) return -1;
  return a - b;
}

function cmpStr(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function sortRides(list: Ride[], key: RideSortKey, dir: RideSortDir): Ride[] {
  const sign = dir === "asc" ? 1 : -1;
  const copy = [...list];
  copy.sort((a, b) => {
    let c = 0;
    switch (key) {
      case "rideId": c = cmpStr(a.rideId, b.rideId); break;
      case "status": c = cmpStr(a.status, b.status); break;
      case "riderName": c = cmpStr(a.rider.name, b.rider.name); break;
      case "customerName": c = cmpStr(a.customer.name, b.customer.name); break;
      case "pickupLabel": c = cmpStr(a.pickup.label, b.pickup.label); break;
      case "dropoffLabel": c = cmpStr(a.dropoff.label, b.dropoff.label); break;
      case "fareAmount": c = cmpNum(a.fare?.amount ?? Number.NaN, b.fare?.amount ?? Number.NaN); break;
      case "startedAt": c = cmpNum(tsOr(a.startedAt), tsOr(b.startedAt)); break;
      case "scheduledAt": c = cmpNum(tsOr(a.scheduledAt), tsOr(b.scheduledAt)); break;
      case "completedAt": c = cmpNum(tsOr(a.completedAt), tsOr(b.completedAt)); break;
      case "duration": c = cmpNum(tsOr(a.completedAt) - tsOr(a.startedAt), tsOr(b.completedAt) - tsOr(b.startedAt)); break;
      case "canceledAt": c = cmpNum(tsOr(a.canceledAt), tsOr(b.canceledAt)); break;
      case "canceledBy": c = cmpStr(a.canceledBy ?? "", b.canceledBy ?? ""); break;
    }
    if (c === 0) return cmpStr(a.rideId, b.rideId);
    return sign * c;
  });
  return copy;
}

function computeSummary(): {
  completedTotal: number;
  canceledTotal: number;
  liveTotal: number;
  upcomingTotal: number;
  areas: { label: string; rides: number }[];
  monthly: { month: string; completed: number; canceled: number }[];
} {
  const completed = RIDES.filter((r) => r.status === "completed");
  const canceled = RIDES.filter((r) => r.status === "canceled");
  const live = RIDES.filter((r) => LIVE_STATUSES.includes(r.status));
  const upcoming = RIDES.filter((r) => r.status === "scheduled");
  const areaCounts = new Map<string, number>();
  for (const r of [...completed, ...canceled]) {
    areaCounts.set(r.pickup.label, (areaCounts.get(r.pickup.label) ?? 0) + 1);
  }
  const areas = Array.from(areaCounts.entries())
    .map(([label, rides]) => ({ label, rides }))
    .sort((a, b) => b.rides - a.rides)
    .slice(0, 6);
  const monthly: { month: string; completed: number; canceled: number }[] = [];
  const now = new Date();
  const anchor = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = 5; i >= 0; i--) {
    const m = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    const next = new Date(anchor.getFullYear(), anchor.getMonth() - i + 1, 1);
    const label = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
    const inMonth = (iso?: string) => {
      if (!iso) return false;
      const t = new Date(iso).getTime();
      return !Number.isNaN(t) && t >= m.getTime() && t < next.getTime();
    };
    monthly.push({
      month: label,
      completed: completed.filter((r) => inMonth(r.completedAt)).length,
      canceled: canceled.filter((r) => inMonth(r.canceledAt)).length,
    });
  }
  return {
    completedTotal: completed.length,
    canceledTotal: canceled.length,
    liveTotal: live.length,
    upcomingTotal: upcoming.length,
    areas,
    monthly,
  };
}

export const ridesHandlers = [
  http.post(API_GET_RIDES_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as GetRidesBody;
    const tab = isTab(body.tab) ? body.tab : "live";
    const sortKey: RideSortKey = isSortKey(body.sortBy) ? body.sortBy : "rideId";
    const sortDir: RideSortDir = isSortDir(body.sortDir) ? body.sortDir : "asc";
    const all = sortRides(ridesForTab(tab).map(jitterLocation), sortKey, sortDir);
    const total = all.length;
    let slice = all;
    if (tab === "completed" || tab === "canceled") {
      const page = typeof body.page === "number" && body.page > 0 ? body.page : 1;
      const pageSize =
        typeof body.pageSize === "number" && body.pageSize > 0 ? body.pageSize : 25;
      const start = (page - 1) * pageSize;
      slice = all.slice(start, start + pageSize);
    }
    return HttpResponse.json({ rides: slice, total, counts: computeCounts() });
  }),
  http.post(API_GET_RIDE_URL, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { rideId?: unknown };
    const rideId = typeof body.rideId === "string" ? body.rideId : "";
    const ride = RIDES.find((r) => r.rideId === rideId);
    if (!ride) {
      return HttpResponse.json(
        { success: false, error: "Ride not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json({ ride: jitterLocation(ride) });
  }),
  http.post(API_GET_RIDES_SUMMARY_URL, async () => {
    return HttpResponse.json(computeSummary());
  }),
];
