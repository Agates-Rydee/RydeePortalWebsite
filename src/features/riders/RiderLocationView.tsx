// Rider location view. In the pre-refactor code this file received a
// loose `params: any` prop populated by the old App.tsx string-switch.
// Under ADR-0002 it's served at `/admin/riders/:riderId/location` and
// receives its data via `useLocation().state`. The `:riderId` route
// param is available via `useParams()` if a future revision needs it.
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useLocation, useParams } from "react-router";

interface RiderLocationState {
  lat: number;
  lon: number;
  name: string;
}

export default function RiderLocationView() {
  const { riderId } = useParams<{ riderId: string }>();
  const location = useLocation();
  const state = (location.state ?? {}) as Partial<RiderLocationState>;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  // If the route was reached directly (deep-link, refresh), state is empty.
  // Match the pre-refactor "just try to render" behavior: show a friendly
  // placeholder rather than crashing on undefined lat/lon.
  if (state.lat === undefined || state.lon === undefined) {
    return (
      <div className="w-full h-full p-4">
        <h2 className="text-xl font-bold mb-4">Rider {riderId ?? ""} — location unavailable</h2>
        <p className="text-sm text-muted-foreground">
          Open this view from the Active Riders list to see live coordinates.
        </p>
      </div>
    );
  }

  if (!isLoaded) return <div role="status" aria-live="polite" className="p-4 text-sm text-muted-foreground">Loading map…</div>;

  const { lat, lon, name } = state as RiderLocationState;

  return (
    <div className="w-full h-full p-4">
      <h2 className="text-xl font-bold mb-4">{name}'s Location</h2>

      <div className="w-full h-[500px] rounded-xl overflow-hidden">
        <GoogleMap
          center={{ lat, lng: lon }}
          zoom={16}
          mapContainerStyle={{ width: "100%", height: "100%" }}
        >
          <Marker
            position={{ lat, lng: lon }}
            icon={{
              url: "/rider-icon.png",
              scaledSize: new window.google.maps.Size(48, 48),
            }}
          />
        </GoogleMap>
      </div>
    </div>
  );
}
