import ActiveRiders from "@/features/riders/ActiveRiders";
import AllRiders from "@/features/riders/AllRiders";
import PendingRiders from "@/features/riders/PendingRiders";

export function AllRidersRoute() {
  return <AllRiders />;
}

export function ActiveRidersRoute() {
  return <ActiveRiders />;
}

export function PendingRidersRoute() {
  return <PendingRiders />;
}