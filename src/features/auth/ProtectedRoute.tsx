import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./useAuth";
import { roleHome } from "@/types/profile";

interface ProtectedRouteProps {
  allow: readonly string[];
}

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

// If the authenticated profile has a role that roleHome does not recognise,
// roleHome returns "/login" and PublicOnly would otherwise send the user back
// to a protected route, which would loop through here again. The effect below
// clears the session in that case; showing the login form in the interim is
// safe because the effect runs on the next render.
export function PublicOnly() {
  const { profile, logout } = useAuth();
  const home = profile ? roleHome(profile.role) : null;
  const unknownRole = home === "/login";

  useEffect(() => {
    if (profile && unknownRole) {
      logout();
    }
  }, [profile, unknownRole, logout]);

  if (profile && !unknownRole) {
    return <Navigate to={home!} replace />;
  }
  return <Outlet />;
}
