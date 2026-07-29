// Route tree + guard wiring per ADR-0002.
//
// This module intentionally does the "translation" from the old
// string-based onNavigate/onLogout/onBack props to react-router
// navigation, so the page components under src/features/{dashboards,riders}/
// stay untouched. When those pages are later modernized (deferred),
// their prop contracts can be replaced with useNavigate() directly.
import { Navigate, Outlet, createBrowserRouter, useNavigate } from "react-router";
import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import { ProtectedRoute, PublicOnly } from "@/features/auth/ProtectedRoute";
import { roleHome } from "@/types/profile";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import RiderDashboard from "@/features/dashboards/RiderDashboard";
import AdminDashboard from "@/features/dashboards/AdminDashboard";
import OperatorDashboard from "@/features/dashboards/OperatorDashboard";
import ActiveRiders from "@/features/riders/ActiveRiders";
import PendingRiders from "@/features/riders/PendingRiders";
import RiderLocationView from "@/features/riders/RiderLocationView";

/**
 * Root layout: mounts AuthProvider so every route can `useAuth()`.
 */
function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

/**
 * `/` — send authed users to their role home; unauthed → /login.
 */
function IndexRedirect() {
  const { profile } = useAuth();
  return <Navigate to={profile ? roleHome(profile.role) : "/login"} replace />;
}

// ─── Route-element adapters ──────────────────────────────────────
// Each adapter maps the old string-nav props the page components
// still expect onto react-router navigation. Pure wiring; no page
// internals touched.

function AdminDashboardRoute() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const onNavigate = (p: string) => {
    switch (p) {
      case "admin-register":  return navigate("/admin/register");
      case "active-riders":   return navigate("/admin/active-riders");
      case "pending-riders":  return navigate("/admin/pending-riders");
      default:                return; // no-op for unknown legacy strings
    }
  };
  const onLogout = () => { logout(); navigate("/login", { replace: true }); };
  return <AdminDashboard onNavigate={onNavigate} onLogout={onLogout} adminName={profile?.name} />;
}

function OperatorDashboardRoute() {
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
  return <OperatorDashboard onNavigate={onNavigate} onLogout={onLogout} operatorName={profile?.name} />;
}

function RiderDashboardRoute() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  // RiderDashboard currently declares onNavigate but never calls it;
  // pass a no-op cast-compatible stub.
  const onNavigate: (route: string, params?: unknown) => void = () => {};
  const onLogout = () => { logout(); navigate("/login", { replace: true }); };
  // TODO(D6): RiderDashboard has an inline Profile shape (rideArea/distanceTraveled/ratings)
  // that diverges from @/types/profile. Unify in a follow-up; safe because RiderDashboard
  // guards on missing fields at render time.
  // @ts-expect-error legacy Profile shape mismatch — see TODO(D6) above
  return <RiderDashboard onNavigate={onNavigate} onLogout={onLogout} profile={profile ?? undefined} />;
}

function ActiveRidersRoute() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  // Preserve old "back to your own dashboard" behavior. Non-admins
  // can only reach this via the operator dashboard (which also opens
  // ActiveRiders); route themselves back to their role home.
  const onBack = () => navigate(roleHome(profile?.role));
  return <ActiveRiders onBack={onBack} />;
}

function PendingRidersRoute() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const onBack = () => navigate(roleHome(profile?.role));
  return <PendingRiders onBack={onBack} />;
}

// ─── Router ───────────────────────────────────────────────────────

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <IndexRedirect /> },

      // Public-only (login / register)
      {
        element: <PublicOnly />,
        children: [
          { path: "login",    element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
        ],
      },

      // Rider
      {
        element: <ProtectedRoute allow={["Rider"]} />,
        children: [
          { path: "rider", element: <RiderDashboardRoute /> },
        ],
      },

      // Admin-only surface (dashboard + create-user)
      {
        element: <ProtectedRoute allow={["Admin"]} />,
        children: [
          { path: "admin",           element: <AdminDashboardRoute /> },
          { path: "admin/register",  element: <RegisterPage showRole backTo="/admin" /> },
        ],
      },

      // Rider-management views: shared by Admin AND Operator per ADR-0002
      // (amended 2026-07-29 for QA F3 / user Option A).
      {
        element: <ProtectedRoute allow={["Admin", "Operator"]} />,
        children: [
          { path: "admin/active-riders",             element: <ActiveRidersRoute /> },
          { path: "admin/pending-riders",            element: <PendingRidersRoute /> },
          { path: "admin/riders/:riderId/location",  element: <RiderLocationView /> },
        ],
      },

      // Operator dashboard
      {
        element: <ProtectedRoute allow={["Operator"]} />,
        children: [
          { path: "operator", element: <OperatorDashboardRoute /> },
        ],
      },

      // Catch-all: send unknown paths through the index redirect.
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
