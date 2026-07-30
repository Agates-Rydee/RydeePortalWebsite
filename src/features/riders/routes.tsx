// Route-element adapters for the rider-management pages. Split out of
// src/router.tsx in Iteration 2 for react-refresh/only-export-components.
import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/types/profile";
import ActiveRiders from "@/features/riders/ActiveRiders";
import PendingRiders from "@/features/riders/PendingRiders";

export function ActiveRidersRoute() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  // Preserve old "back to your own dashboard" behavior.
  const onBack = () => navigate(roleHome(profile?.role));
  return <ActiveRiders onBack={onBack} />;
}

export function PendingRidersRoute() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const onBack = () => navigate(roleHome(profile?.role));
  return <PendingRiders onBack={onBack} />;
}
