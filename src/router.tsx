import { Navigate, createBrowserRouter } from "react-router";
import { ProtectedRoute, PublicOnly } from "@/features/auth/ProtectedRoute";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import { RootLayout, IndexRedirect } from "@/router-layout";
import { DashboardLayout } from "@/features/layout/DashboardLayout";
import { DashboardRoute, RiderDashboardRoute } from "@/features/dashboards/routes";
import {
  ActiveRidersRoute,
  AllRidersRoute,
  BlockedRidersRoute,
  PendingRidersRoute,
  RiderEditRoute,
} from "@/features/riders/routes";
import { RidesRoute, RideViewRoute } from "@/features/rides/routes";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <IndexRedirect /> },

      {
        element: <PublicOnly />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
        ],
      },

      {
        element: <ProtectedRoute allow={["Rider"]} />,
        children: [{ path: "rider", element: <RiderDashboardRoute /> }],
      },

      {
        element: <DashboardLayout />,
        children: [
          {
            element: <ProtectedRoute allow={["Admin"]} />,
            children: [
              { path: "admin", element: <DashboardRoute /> },
              { path: "admin/register", element: <RegisterPage showRole backTo="/admin" /> },
            ],
          },
          {
            element: <ProtectedRoute allow={["Admin", "Operator"]} />,
            children: [
              { path: "admin/active-riders", element: <ActiveRidersRoute /> },
              { path: "admin/pending-riders", element: <PendingRidersRoute /> },
              { path: "admin/blocked-riders", element: <BlockedRidersRoute /> },
              { path: "admin/all-riders", element: <AllRidersRoute /> },
              { path: "admin/riders/:phone/edit", element: <RiderEditRoute /> },
              { path: "admin/rides", element: <RidesRoute /> },
              { path: "admin/rides/:rideId", element: <RideViewRoute /> },
            ],
          },
          {
            element: <ProtectedRoute allow={["Operator"]} />,
            children: [{ path: "operator", element: <DashboardRoute /> }],
          },
        ],
      },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
