// Guard layout routes per ADR-0002 §"Decision — Guard Pattern & Redirects".
// Both guards render <Outlet/> when access is allowed so they can be used
// as `element` on layout routes.
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthProvider";
import { roleHome } from "@/types/profile";

interface ProtectedRouteProps {
  /** Case-insensitive role names allowed to access the child routes. */
  allow: readonly string[];
}

/**
 * Requires an authenticated profile whose role appears in `allow`.
 * - No profile → redirect to /login, remembering the original location.
 * - Wrong role → redirect to the user's own role home (no 403 page).
 */
export function ProtectedRoute({ allow }: ProtectedRouteProps) {
  const { profile } = useAuth();
  const location = useLocation();

  if (!profile) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const roleLc = (profile.role ?? "").toLowerCase();
  const allowed = allow.some((r) => r.toLowerCase() === roleLc);
  if (!allowed) {
    return <Navigate to={roleHome(profile.role)} replace />;
  }

  return <Outlet />;
}

/**
 * Wraps public-only pages (login / register). Authed users are bounced to
 * their role home so they can't see the login form while signed in.
 */
export function PublicOnly() {
  const { profile } = useAuth();
  if (profile) {
    return <Navigate to={roleHome(profile.role)} replace />;
  }
  return <Outlet />;
}
