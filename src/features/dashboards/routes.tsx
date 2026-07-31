import { useNavigate } from "react-router";
import { useAuth } from "@/features/auth/useAuth";
import AdminDashboard from "@/features/dashboards/AdminDashboard";
import OperatorDashboard from "@/features/dashboards/OperatorDashboard";
import RiderDashboard from "@/features/dashboards/RiderDashboard";

export function AdminDashboardRoute() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const onNavigate = (p: string) => {
    switch (p) {
      case "admin-register":  return navigate("/admin/register");
      case "active-riders":   return navigate("/admin/active-riders");
      case "pending-riders":  return navigate("/admin/pending-riders");
      case "all-riders":      return navigate("/admin/all-riders");
      default:                return;
    }
  };
  const onLogout = () => { logout(); navigate("/login", { replace: true }); };
  return <AdminDashboard onNavigate={onNavigate} onLogout={onLogout} profile={profile ?? null} />;
}

export function OperatorDashboardRoute() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const onNavigate = (p: string) => {
    switch (p) {
      case "active-riders":  return navigate("/admin/active-riders");
      case "pending-riders": return navigate("/admin/pending-riders");
      default:               return;
    }
  };
  const onLogout = () => { logout(); navigate("/login", { replace: true }); };
  return <OperatorDashboard onNavigate={onNavigate} onLogout={onLogout} profile={profile ?? null} />;
}

export function RiderDashboardRoute() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  // RiderDashboard declares onNavigate but never invokes it, so a no-op is safe.
  const onNavigate: (route: string, params?: unknown) => void = () => {};
  const onLogout = () => { logout(); navigate("/login", { replace: true }); };
  return <RiderDashboard onNavigate={onNavigate} onLogout={onLogout} profile={profile ?? null} />;
}
