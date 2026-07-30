// Route tree per ADR-0002.
//
// This module intentionally exports ONLY the router value — layout,
// index redirect, and per-feature route adapters live alongside their
// features (see src/router-layout.tsx, src/features/dashboards/routes.tsx,
// src/features/riders/routes.tsx). Split completed 2026-07-30 to clear
// the react-refresh/only-export-components lint warnings.
import { Navigate, createBrowserRouter } from "react-router";
import { ProtectedRoute, PublicOnly } from "@/features/auth/ProtectedRoute";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import RiderLocationView from "@/features/riders/RiderLocationView";
import { RootLayout, IndexRedirect } from "@/router-layout";
import {
  AdminDashboardRoute,
  OperatorDashboardRoute,
  RiderDashboardRoute,
} from "@/features/dashboards/routes";
import {
  ActiveRidersRoute,
  PendingRidersRoute,
} from "@/features/riders/routes";

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

      // Catch-all
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
