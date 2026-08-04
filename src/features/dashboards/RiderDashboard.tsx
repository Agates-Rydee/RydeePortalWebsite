import { useTranslation } from "react-i18next";
import { DashboardHeader } from "@/features/dashboards/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Star } from "lucide-react";
import type { Profile } from "@/types/profile";

function RatingStars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.floor(rating)));
  const label = rating.toFixed(1) + " out of 5";
  return (
    <span className="inline-flex items-center gap-2 align-middle" aria-label={label}>
      <span className="inline-flex" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            className={i < filled ? "h-6 w-6 text-warning" : "h-6 w-6 text-muted-foreground"}
            fill={i < filled ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        ))}
      </span>
      <span className="text-2xl font-bold text-warning">{rating.toFixed(1) + "/5"}</span>
    </span>
  );
}

interface Props {
  onNavigate: (route: string, params?: unknown) => void;
  onLogout: () => void;
  profile: Profile | null;
}

export default function RiderDashboard({ onLogout, profile }: Props) {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === "ur";

  const lat = Number(profile?.currentLocation?.lat);
  const lon = Number(profile?.currentLocation?.lon);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lon);
  const center: [number, number] = hasLocation ? [lat, lon] : [24.8607, 67.0011];

  return (
    <div
      className="min-h-screen w-full flex flex-col bg-background"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      dir={isUrdu ? "rtl" : undefined}
    >
      <DashboardHeader onLogout={onLogout} />

      <main className="flex-1 px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            {t("dashboards.rider.welcome", { name: profile?.name })}
          </h1>
          <h2 className="text-2xl font-bold text-foreground">
            {t("dashboards.rider.yourDashboard")}
          </h2>
          <p className="text-sm mt-1 text-muted-foreground">{t("dashboards.rider.subhead")}</p>
        </div>
        <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(300px,40%)_1fr] gap-6">
          <Card className="rounded-2xl p-6 card-elevated border-border">
            <h2 className="text-xl font-bold mb-4 text-foreground">
              {t("dashboards.rider.profileHeading")}
            </h2>
            <table className="w-full border-collapse" data-fqa-profile-kv>
              <caption className="sr-only">{t("dashboards.rider.profileCaption")}</caption>
              <tbody>
                <tr>
                  <td
                    className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground"
                    style={{ width: "180px" }}
                  >
                    {t("dashboards.rider.fields.name")}
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold text-foreground">
                    {profile?.name}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">
                    {t("dashboards.rider.fields.address")}
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold text-foreground">
                    {profile?.address}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">
                    {t("dashboards.rider.fields.dob")}
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold text-foreground">
                    {profile?.dob}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">
                    {t("dashboards.rider.fields.area")}
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold text-foreground">
                    {profile?.area}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">
                    {t("dashboards.rider.fields.gps")}
                  </td>
                  <td className="py-3 px-2 text-sm font-semibold text-foreground">
                    {profile?.currentLocation?.lat}, {profile?.currentLocation?.lon}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">
                    {t("dashboards.rider.fields.totalRides")}
                  </td>
                  <td className="py-3 px-2 text-2xl font-bold text-primary">
                    {profile?.totalRides}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">
                    {t("dashboards.rider.fields.missedRides")}
                  </td>
                  <td className="py-3 px-2 text-2xl font-bold text-warning">
                    {profile?.missedRides}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">
                    {t("dashboards.rider.fields.distanceTraveled")}
                  </td>
                  <td className="py-3 px-2 text-2xl font-bold text-warning">
                    {(profile?.totalDistance ?? 0) + " Km"}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">
                    {t("dashboards.rider.fields.onlineState")}
                  </td>
                  <td className="py-3 px-2 text-2xl font-bold text-warning">
                    {profile?.online
                      ? t("dashboards.rider.status.online")
                      : t("dashboards.rider.status.offline")}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">
                    {t("dashboards.rider.fields.ratings")}
                  </td>
                  <td className="py-3 px-2">
                    <RatingStars rating={profile?.rating ?? 0} />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium uppercase tracking-widest text-sm text-muted-foreground">
                    {t("dashboards.rider.fields.activationStatus")}
                  </td>
                  <td
                    className={
                      "py-3 px-2 text-2xl font-semibold " +
                      (profile?.activationStatus === "active" ? "text-primary" : "text-destructive")
                    }
                  >
                    {profile?.activationStatus === "active"
                      ? t("dashboards.rider.status.active")
                      : t("dashboards.rider.status.inactive")}
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>

          <div className="w-full max-w-[850px] h-[400px] lg:h-[600px] rounded-xl overflow-hidden border border-border">
            <MapContainer
              center={center}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {hasLocation && (
                <CircleMarker
                  center={center}
                  radius={12}
                  pathOptions={{
                    fillColor: "#15803d",
                    fillOpacity: 0.9,
                    color: "#ffffff",
                    weight: 2,
                  }}
                >
                  <Popup>{profile?.name}</Popup>
                </CircleMarker>
              )}
            </MapContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
