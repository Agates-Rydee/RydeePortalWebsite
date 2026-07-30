// Rider-role dashboard. Reads an extended Profile shape (see
// @/types/profile — `area`, `distanceTraveled`, `ratings` were added
// there in Iteration 2 / D6 so this file no longer needs an inline
// shape or `@ts-nocheck`).
import { Logo } from "@/components/shared";
import { cardStyle } from "@/components/shared-styles";
import logoUrl from "@/assets/MapIcon.png";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import type { Profile } from "@/types/profile";

interface Props {
  // Route adapter in src/router.tsx keeps this prop for now; unused
  // internally. Widened to `unknown` params so the adapter can pass its
  // stub without a cast.
  onNavigate: (route: string, params?: unknown) => void;
  onLogout: () => void;
  profile: Profile | null;
}

export default function RiderDashboard({ onLogout, profile }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY ?? "",
  });

  if (!isLoaded) {
    return <div>Loading map…</div>;
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
      className="min-h-screen w-full flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "var(--background)" }}
    >
      {/* Top nav */}
      <header
        className="w-full flex items-center justify-between px-6 py-4 sticky top-0 z-10"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        <Logo size="sm" />
        <button
          onClick={onLogout}
          className="text-sm font-small px-4 py-2 rounded-xl transition-all duration-150"
          style={{ color: "var(--muted-foreground)", background: "var(--muted)", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#17a882"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; }}
        >
          Sign out
        </button>
      </header>

      {/* Body */}
      <main className="flex-1 px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Welcome back {profile?.name} </h1>
          <h2 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Your Dashboard</h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Everything you need for your account.
          </p>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-[40%_60%] gap-6">
          {/* LEFT SIDE — Rider Profile Table */}
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
              Rider Profile
            </h2>
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)", width: "180px" }}>
                    Name
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {profile?.name}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)" }}>
                    Address
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {profile?.address}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)" }}>
                    Date of Birth
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {profile?.dob}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)" }}>
                    Area
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {profile?.area}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)" }}>
                    GPS Location
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {profile?.currentLocation?.lat}, {profile?.currentLocation?.lon}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)" }}>
                    Total Rides
                  </td>
                  <td className="py-3 px-2 text-2xl font-bold" style={{ color: "#17a882" }}>
                    {profile?.totalRides}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)" }}>
                    Missed Rides
                  </td>
                  <td className="py-3 px-2 text-2xl font-bold" style={{ color: "#f59e0b" }}>
                    {profile?.missedRides}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)" }}>
                    Distance Traveled
                  </td>
                  <td className="py-3 px-2 text-2xl font-bold" style={{ color: "#f59e0b" }}>
                    {(profile?.distanceTraveled ?? 0) + " Km"}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)" }}>
                    Online State
                  </td>
                  <td className="py-3 px-2 text-2xl font-bold" style={{ color: "#f59e0b" }}>
                    {profile?.online ? "Online" : "Offline"}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)" }}>
                    Ratings
                  </td>
                  <td className="py-3 px-2 text-2xl font-bold" style={{ color: "#f59e0b" }}>
                    {profile?.ratings}
                  </td>
                </tr>

                <tr>
                  <td className="py-3 px-2 font-small uppercase tracking-widest text-sm"
                      style={{ color: "var(--muted-foreground)" }}>
                    Activation Status
                  </td>
                  <td className="py-3 px-2 text-2xl font-semibold"
                      style={{ color: profile?.online ? "#17a882" : "#ef4444" }}>
                    {profile?.online ? "Active" : "Inactive"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* RIGHT SIDE — Google Map */}
          <div className="w-[850px] h-[600px] rounded-xl overflow-hidden">
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
