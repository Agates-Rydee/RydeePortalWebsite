// Root layout + index redirect. Extracted from src/router.tsx so
// router.tsx exports only the route tree (satisfies
// react-refresh/only-export-components).
import { Navigate, Outlet } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/types/profile";

/** Mounts AuthProvider so every route can `useAuth()`. */
export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

/** `/` — send authed users to their role home; unauthed → /login. */
export function IndexRedirect() {
  const { profile } = useAuth();
  return <Navigate to={profile ? roleHome(profile.role) : "/login"} replace />;
}
