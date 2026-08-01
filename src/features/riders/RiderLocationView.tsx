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

  if (state.lat === undefined || state.lon === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        <p className="text-sm text-muted-foreground">
          Rider {riderId ?? ""} — location unavailable. Open this view from the Active Riders list to see live coordinates.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div role="status" aria-live="polite" className="p-4 md:p-6 text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }

  const { lat, lon, name } = state as RiderLocationState;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <p className="text-sm text-muted-foreground">{name}</p>

      <div className="w-full h-[500px] rounded-xl overflow-hidden border border-border">
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
