import { Navigate, Outlet } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { useAuth } from "@/features/auth/useAuth";
import { roleHome } from "@/types/profile";

export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export function IndexRedirect() {
  const { profile } = useAuth();
  return <Navigate to={profile ? roleHome(profile.role) : "/login"} replace />;
}
