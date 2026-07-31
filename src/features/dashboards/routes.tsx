// Route-element adapters for the three dashboards. Split out of
// src/router.tsx in Iteration 2 so router.tsx exports only the
// createBrowserRouter tree (satisfies react-refresh/only-export-components).
//
// Each adapter maps the old string-nav props the page components still
// expect onto react-router navigation. Pure wiring — no page internals
// touched. When pages migrate to useNavigate() directly the adapters
// can be inlined.
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
  // RiderDashboard declares onNavigate but never calls it; pass a no-op.
  const onNavigate: (route: string, params?: unknown) => void = () => {};
  const onLogout = () => { logout(); navigate("/login", { replace: true }); };
  return <RiderDashboard onNavigate={onNavigate} onLogout={onLogout} profile={profile ?? null} />;
}
