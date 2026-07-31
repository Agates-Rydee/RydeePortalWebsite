import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/features/dashboards/components/DashboardHeader";
import { StatCard } from "@/features/dashboards/components/StatCard";
import { API_GET_UNREGISTERED_RIDERS_URL } from "@/lib/config";
import type { Profile } from "@/types/profile";

interface Props {
  onNavigate: (p: string) => void;
  onLogout: () => void;
  profile: Profile | null;
}

interface UnregisteredRidersResponse {
  riders?: Array<Record<string, unknown>>;
}

export default function AdminDashboard({ onNavigate, onLogout, profile }: Props) {
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [totalRiders, setTotalRiders] = useState<number | null>(null);
  const [activeRiders, setActiveRiders] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPending = async (): Promise<void> => {
      try {
        const response = await fetch(API_GET_UNREGISTERED_RIDERS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || response.statusText || "NO RESPONSE");
        }

        const data = (await response.json()) as UnregisteredRidersResponse;

        if (!data || !Array.isArray(data.riders)) {
          throw new Error("Invalid response shape");
        }

        const pending = data.riders.filter((r) => {
          const status = String(
            r.activation_status ?? r.activationStatus ?? "",
          ).toLowerCase().trim();
          return status === "pending";
        }).length;
        const total = data.riders.length;
        const active = total - pending;

        if (cancelled) return;
        setPendingCount(pending);
        setTotalRiders(total);
        setActiveRiders(active);
      } catch (err) {
        console.error("AdminDashboard: failed to load unregistered riders", err);
      }
    };

    void loadPending();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="min-h-screen w-full flex flex-col bg-background"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <DashboardHeader roleLabel="Admin" userName={profile?.name} onLogout={onLogout} />

      <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard </h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Manage users, riders, and operations across Karachi.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="rounded-2xl border border-[color:var(--brand-bright)]/30 card-elevated card-elevated-hover transition-shadow p-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onNavigate("admin-register")}
              className="w-full h-auto p-6 flex items-center justify-between text-left rounded-2xl hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  User Management
                </p>
                <p className="text-lg font-semibold mt-1 text-primary">Register new user</p>
                <p className="text-xs mt-1 text-muted-foreground whitespace-normal">
                  Add a new Operator, Customer, or Rider role
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[color:var(--brand-bright)]/10">
                <svg
                  width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className="text-primary" aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
            </Button>
          </Card>

          <StatCard
            label="Total Riders"
            value={totalRiders}
            onClick={() => onNavigate("all-riders")}
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
            value={activeRiders}
            valueClassName="text-primary"
            onClick={() => onNavigate("active-riders")}
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
            value={pendingCount}
            valueClassName="text-warning"
            onClick={() => onNavigate("pending-riders")}
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
      </main>
    </div>
  );
}
