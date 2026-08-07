import ActiveRiders from "@/features/riders/ActiveRiders";
import AllRiders from "@/features/riders/AllRiders";
import BlockedRiders from "@/features/riders/BlockedRiders";
import PendingRiders from "@/features/riders/PendingRiders";
import RiderEditPage from "@/features/riders/pages/RiderEditPage";

export function AllRidersRoute() {
  return <AllRiders />;
}

export function ActiveRidersRoute() {
  return <ActiveRiders />;
}

export function PendingRidersRoute() {
  return <PendingRiders />;
}

export function BlockedRidersRoute() {
  return <BlockedRiders />;
}

export function RiderEditRoute() {
  return <RiderEditPage />;
}
