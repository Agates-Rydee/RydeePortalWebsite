import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface StatCardProps {
  label: string;
  value: number | string | null;
  valueClassName?: string;
  hint: string;
  ariaLabel: string;
  onClick: () => void;
  icon: React.ReactNode;
}

function StatCard({ label, value, valueClassName, hint, ariaLabel, onClick, icon }: StatCardProps) {
  const display = value ?? "—";
  const interactive = value != null;
  const cardClasses =
    "rounded-xl gap-0 py-4 text-left w-full transition-shadow " +
    "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const content = (
    <>
      <CardHeader>
        <CardDescription className="text-xs">{label}</CardDescription>
        <CardTitle className={`text-2xl font-semibold tabular-nums @[250px]/card-header:text-3xl ${valueClassName ?? ""}`}>
          {display}
        </CardTitle>
        <CardAction className="text-muted-foreground">{icon}</CardAction>
      </CardHeader>
      <CardFooter className="pt-3 text-xs text-muted-foreground">{hint}</CardFooter>
    </>
  );
  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={
          "bg-card text-card-foreground flex flex-col gap-0 rounded-xl border py-4 text-left w-full transition-shadow " +
          "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        }
      >
        {content}
      </button>
    );
  }
  return <Card className={cardClasses}>{content}</Card>;
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {isAdmin && (
          <button
            type="button"
            onClick={() => navigate("/admin/register")}
            aria-label="Register new user"
            className="bg-card text-card-foreground flex flex-col gap-0 rounded-xl border py-4 text-left w-full transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <CardHeader>
              <CardDescription className="text-xs">User management</CardDescription>
              <CardTitle className="text-2xl font-semibold text-primary">Register new user</CardTitle>
              <CardAction className="text-muted-foreground">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </CardAction>
            </CardHeader>
            <CardFooter className="pt-3 text-xs text-muted-foreground">
              Add a new Operator, Customer, or Rider →
            </CardFooter>
          </button>
        )}

        <StatCard
          label="Total Riders"
          value={total}
          hint="View all riders →"
          ariaLabel={`View ${total ?? "—"} total riders`}
          onClick={() => navigate("/admin/all-riders")}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          hint="Tap to view live map →"
          ariaLabel={`View ${active ?? "—"} active riders`}
          onClick={() => navigate("/admin/active-riders")}
          icon={
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 bg-[color:var(--brand-bright)]" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[color:var(--brand-bright)]" />
            </span>
          }
        />

        <StatCard
          label="Pending Riders"
          value={pending}
          valueClassName="text-warning"
          hint="Tap to review applications →"
          ariaLabel={`View ${pending ?? "—"} pending riders`}
          onClick={() => navigate("/admin/pending-riders")}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
      </div>

      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-semibold text-foreground">Active riders</h2>
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

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {rows === null ? (
          <div className="px-6 py-10 text-sm text-muted-foreground" role="status" aria-live="polite">
            Loading active riders…
          </div>
        ) : activeRows.length === 0 ? (
          <div className="px-6 py-10 text-sm text-muted-foreground">No active riders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
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
      </div>
    </div>
  );
}