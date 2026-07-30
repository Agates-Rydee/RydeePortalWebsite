// Guard layout routes per ADR-0002 §"Decision — Guard Pattern & Redirects".
// Both guards render <Outlet/> when access is allowed so they can be used
// as `element` on layout routes.
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./useAuth";
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
 *
 * F1 fix: if roleHome() returns '/login' (unknown / Customer / empty role),
 * the user would ping-pong ProtectedRoute → PublicOnly → ProtectedRoute
 * forever. Detect that case, call logout() so profile becomes null, then
 * render the login form on the next render cycle.
 */
export function PublicOnly() {
  const { profile, logout } = useAuth();
  const home = profile ? roleHome(profile.role) : null;
  const unknownRole = home === "/login";

  // Break the redirect loop that would otherwise arise for authed users
  // whose role does not map to any dashboard (empty, 'Customer', garbage):
  // ProtectedRoute→/login→PublicOnly→/login→… → blank screen.
  // Effect runs after render, so no setState-during-render warning.
  useEffect(() => {
    if (profile && unknownRole) {
      logout();
    }
  }, [profile, unknownRole, logout]);

  if (profile && !unknownRole) {
    return <Navigate to={home!} replace />;
  }
  // Either not authed, or authed with an unknown role (effect above will
  // clear the session; showing the login form in the meantime is safe).
  return <Outlet />;
}
