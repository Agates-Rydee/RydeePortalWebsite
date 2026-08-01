import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/features/dashboards/components/StatCard";
import { getAllRiders } from "@/api/riders";
import { mapAllRidersResponse } from "@/features/riders/mapper";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/types/profile";
import type { AllRidersRow } from "@/types/rider";

interface WireResponse {
  riders?: Array<Record<string, unknown>>;
}

function formatJoined(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = roleHome(profile?.role) === "/admin";

  const [rows, setRows] = useState<AllRidersRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = (await getAllRiders()) as WireResponse;
        if (!data || !Array.isArray(data.riders)) throw new Error("Invalid response shape");
        const mapped = mapAllRidersResponse(data.riders);
        if (!cancelled) setRows(mapped);
      } catch (err) {
        console.error("Dashboard: failed to load riders", err);
        if (!cancelled) setRows([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const total = rows?.length ?? null;
  const active = rows ? rows.filter((r) => r.status === "active").length : null;
  const pending = rows ? rows.filter((r) => r.status === "pending").length : null;
  const activeRows = (rows ?? []).filter((r) => r.status === "active").slice(0, 10);

  return (
    <div
      className="flex-1 w-full flex flex-col bg-background"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <main className="flex-1 px-6 py-10 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Manage users, riders, and operations across Karachi.
          </p>
        </div>

        <div
          className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
        >
          {isAdmin && (
            <StatCard
              label="User management"
              value="Register"
              valueClassName="text-primary text-2xl"
              onClick={() => navigate("/admin/register")}
              hint="Add a new Operator, Customer, or Rider →"
              icon={
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className="text-primary" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              }
            />
          )}

          <StatCard
            label="Total Riders"
            value={total}
            onClick={() => navigate("/admin/all-riders")}
            hint="View all riders →"
            icon={
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className="text-primary" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />

          <StatCard
            label="Active Riders"
            value={active}
            valueClassName="text-primary"
            onClick={() => navigate("/admin/active-riders")}
            hint="Tap to view live map →"
            icon={
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 bg-[color:var(--brand-bright)]" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[color:var(--brand-bright)]" />
              </span>
            }
          />

          <StatCard
            label="Pending Riders"
            value={pending}
            valueClassName="text-warning"
            onClick={() => navigate("/admin/pending-riders")}
            hint="Tap to review applications →"
            iconBgClassName="bg-warning-muted"
            icon={
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className="text-warning" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            }
          />
        </div>

        <Card className="mt-8 rounded-2xl border-border card-elevated p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Active riders</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Latest {activeRows.length} of {active ?? 0}
              </p>
            </div>
            <Link
              to="/admin/active-riders"
              className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1"
            >
              View all →
            </Link>
          </div>

          {rows === null ? (
            <div className="px-6 py-10 text-sm text-muted-foreground" role="status" aria-live="polite">
              Loading active riders…
            </div>
          ) : activeRows.length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No active riders yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Name</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Phone</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Area</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <th scope="row" className="px-4 py-3 font-medium text-foreground text-left">
                        {r.name || "—"}
                      </th>
                      <td className="px-4 py-3 font-mono text-xs">{r.phone || "—"}</td>
                      <td className="px-4 py-3">{r.area || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatJoined(r.joinedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
