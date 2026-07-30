// Rider-role dashboard. D8 Phase 2: shared DashboardHeader + responsive
// grid fix (was w-[850px] fixed; now w-full max-w-[850px]). Table body
// migration to shadcn Table is deferred to Phase 4 per spec §7.
import { DashboardHeader } from "@/features/dashboards/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import logoUrl from "@/assets/MapIcon.png";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import type { Profile } from "@/types/profile";

interface Props {
  onNavigate: (route: string, params?: unknown) => void;
  onLogout: () => void;
  profile: Profile | null;
}

export default function RiderDashboard({ onLogout, profile }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY ?? "",
  });

  if (!isLoaded) {
    return (
      <div role="status" aria-live="polite" className="p-6 text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }

  const lat = Number(profile?.currentLocation?.lat);
  const lon = Number(profile?.currentLocation?.lon);
  const center = { lat, lng: lon };

  const riderIcon = {
    url: logoUrl,
    scaledSize: new window.google.maps.Size(40, 40),
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col bg-background"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <DashboardHeader onLogout={onLogout} />

      <main className="flex-1 px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome back {profile?.name} </h1>
          <h2 className="text-2xl font-bold text-foreground">Your Dashboard</h2>
          <p className="text-sm mt-1 text-muted-foreground">
            Everything you need for your account.
          </p>
        </div>
        <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(300px,40%)_1fr] gap-6">
          {/* LEFT — Rider Profile table (shadcn Table migration → Phase 4) */}
          <Card className="rounded-2xl p-6 card-elevated border-border">
            <h2 className="text-xl font-bold mb-4 text-foreground">Rider Profile</h2>
            <table className="w-full border-collapse">
              <caption className="sr-only">Rider profile summary</caption>
              <tbody>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground" style={{ width: "180px" }}>
                    Name
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold text-foreground">{profile?.name}</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">Address</td>
                  <td className="py-3 px-2 text-sm font-semibold text-foreground">{profile?.address}</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">Date of Birth</td>
                  <td className="py-3 px-2 text-sm font-semibold text-foreground">{profile?.dob}</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">Area</td>
                  <td className="py-3 px-2 text-sm font-semibold text-foreground">{profile?.area}</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">GPS Location</td>
                  <td className="py-3 px-2 text-sm font-semibold text-foreground">
                    {profile?.currentLocation?.lat}, {profile?.currentLocation?.lon}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">Total Rides</td>
                  <td className="py-3 px-2 text-2xl font-bold text-primary">{profile?.totalRides}</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">Missed Rides</td>
                  <td className="py-3 px-2 text-2xl font-bold text-warning">{profile?.missedRides}</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">Distance Traveled</td>
                  <td className="py-3 px-2 text-2xl font-bold text-warning">
                    {(profile?.distanceTraveled ?? 0) + " Km"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">Online State</td>
                  <td className="py-3 px-2 text-2xl font-bold text-warning">
                    {profile?.online ? "Online" : "Offline"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">Ratings</td>
                  <td className="py-3 px-2 text-2xl font-bold text-warning">{profile?.ratings}</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">Activation Status</td>
                  <td
                    className={
                      "py-3 px-2 text-2xl font-semibold " +
                      (profile?.online ? "text-primary" : "text-destructive")
                    }
                  >
                    {profile?.online ? "Active" : "Inactive"}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* RIGHT — Google Map (responsive: full width up to 850px cap) */}
          <div className="w-full max-w-[850px] h-[400px] lg:h-[600px] rounded-xl overflow-hidden">
            <GoogleMap
              center={center}
              zoom={16}
              mapContainerStyle={{ width: "100%", height: "100%" }}
            >
              <Marker position={center} icon={riderIcon} />
            </GoogleMap>
          </div>
        </div>
      </main>
    </div>
  );
}
