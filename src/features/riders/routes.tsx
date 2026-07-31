import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/types/profile";
import ActiveRiders from "@/features/riders/ActiveRiders";
import AllRiders from "@/features/riders/AllRiders";
import PendingRiders from "@/features/riders/PendingRiders";

export function AllRidersRoute() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const onBack = () => navigate(roleHome(profile?.role));
  return <AllRiders onBack={onBack} />;
}

export function ActiveRidersRoute() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  // Route the user back to their own role home when the back action fires.
  const onBack = () => navigate(roleHome(profile?.role));
  return <ActiveRiders onBack={onBack} />;
}

export function PendingRidersRoute() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const onBack = () => navigate(roleHome(profile?.role));
  return <PendingRiders onBack={onBack} />;
}
