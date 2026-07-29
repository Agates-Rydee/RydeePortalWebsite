import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO(D7/C5.4): params shape formalised when route params + location.state land in Checkpoint 5
export default function RiderLocationView({ params }: { params: any }) {
  const { lat, lon, name } = params;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY
  });

  if (!isLoaded) return <div>Loading map…</div>;

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
              scaledSize: new window.google.maps.Size(48, 48)
            }}
          />
        </GoogleMap>
      </div>
    </div>
  );
}
