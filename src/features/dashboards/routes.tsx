import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/useAuth";
import Dashboard from "@/features/dashboards/Dashboard";
import RiderDashboard from "@/features/dashboards/RiderDashboard";

export function DashboardRoute() {
  return <Dashboard />;
}

export function RiderDashboardRoute() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const onNavigate: (route: string, params?: unknown) => void = () => {};
  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  return <RiderDashboard onNavigate={onNavigate} onLogout={onLogout} profile={profile ?? null} />;
}
