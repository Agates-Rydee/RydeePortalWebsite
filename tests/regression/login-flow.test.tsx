// Mocked login "E2E-ish" — renders the real LoginPage against the reused
// msw/node handlers. Asserts:
//   1. Success writes an envelope (H7) and lands on the correct role-home.
//   2. D15: profile.role takes precedence over top-level data.role.
//   3. Wrong password surfaces the 401 body text ("Invalid phone or password").
//   4. Client-side validation blocks non-10-digit phones before fetch fires.
import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createMemoryRouter,
} from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute, PublicOnly } from "@/features/auth/ProtectedRoute";
import LoginPage from "@/features/auth/pages/LoginPage";
import { API_LOGIN_URL } from "@/lib/config";
import { SESSION_STORAGE_KEY } from "@/features/auth/session";
import { server } from "../setup";

function RiderHome() { return <div data-testid="rider-home">rider-home</div>; }
function AdminHome() { return <div data-testid="admin-home">admin-home</div>; }
function OperatorHome() { return <div data-testid="operator-home">operator-home</div>; }
function Layout() { return <AuthProvider><Outlet /></AuthProvider>; }

function buildRouter(initial = "/login") {
  return createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          {
            element: <PublicOnly />,
            children: [{ path: "login", element: <LoginPage /> }],
          },
          {
            element: <ProtectedRoute allow={["Rider"]} />,
            children: [{ path: "rider", element: <RiderHome /> }],
          },
          {
            element: <ProtectedRoute allow={["Admin"]} />,
            children: [{ path: "admin", element: <AdminHome /> }],
          },
          {
            element: <ProtectedRoute allow={["Operator"]} />,
            children: [{ path: "operator", element: <OperatorHome /> }],
          },
          { path: "*", element: <Navigate to="/login" replace /> },
        ],
      },
    ],
    { initialEntries: [initial] },
  );
}

async function fillAndSubmit(phone: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/phone number/i), phone);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("mocked login flow — seed users land on role home", () => {
  it("Rider seed → /rider + session envelope written", async () => {
    render(<RouterProvider router={buildRouter("/login")} />);
    await fillAndSubmit("0300111111", "rider");
    expect(await screen.findByTestId("rider-home")).toBeInTheDocument();
    // H7: envelope must have been written by AuthProvider.
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const env = JSON.parse(raw!) as { v: number; profile: { role: string } };
    expect(env.v).toBe(1);
    expect(env.profile.role).toBe("Rider");
  });

  it("Admin seed → /admin", async () => {
    render(<RouterProvider router={buildRouter("/login")} />);
    await fillAndSubmit("0300222222", "admin");
    expect(await screen.findByTestId("admin-home")).toBeInTheDocument();
  });

  it("Operator seed → /operator", async () => {
    render(<RouterProvider router={buildRouter("/login")} />);
    await fillAndSubmit("0300333333", "operator");
    expect(await screen.findByTestId("operator-home")).toBeInTheDocument();
  });
});

describe("login failure paths", () => {
  it("wrong password → surfaces 'Invalid phone or password'", async () => {
    render(<RouterProvider router={buildRouter("/login")} />);
    await fillAndSubmit("0300111111", "WRONG");
    expect(await screen.findByText(/invalid phone or password/i)).toBeInTheDocument();
    // Still on /login (no navigation).
    expect(screen.queryByTestId("rider-home")).toBeNull();
  });

  it("client-side phone validation blocks non-10-digit input (no fetch fires)", async () => {
    // Override handler to fail the test loudly if it's ever hit.
    let hit = false;
    server.use(
      http.post(API_LOGIN_URL, () => {
        hit = true;
        return HttpResponse.json({});
      }),
    );
    render(<RouterProvider router={buildRouter("/login")} />);
    await fillAndSubmit("12345", "anything");
    expect(await screen.findByText(/valid phone number/i)).toBeInTheDocument();
    expect(hit).toBe(false);
  });
});

describe("D15 — response role normalization", () => {
  it("profile.role takes precedence over top-level data.role", async () => {
    // Override: return conflicting roles. Old broken behavior would
    // overwrite profile.role with data.role → "operator" → wrong home.
    // Fixed behavior: profile.role wins → "Admin" → /admin.
    server.use(
      http.post(API_LOGIN_URL, () =>
        HttpResponse.json({
          role: "operator", // top-level (older shape)
          profile: { role: "Admin", name: "Split-Brain" }, // canonical
        }),
      ),
    );
    render(<RouterProvider router={buildRouter("/login")} />);
    await fillAndSubmit("0300000000", "any");
    expect(await screen.findByTestId("admin-home")).toBeInTheDocument();
    // Envelope reflects the canonical role, not the top-level one.
    const env = JSON.parse(
      window.localStorage.getItem(SESSION_STORAGE_KEY)!,
    ) as { profile: { role: string } };
    expect(env.profile.role).toBe("Admin");
  });

  it("falls back to top-level data.role when profile.role is empty", async () => {
    server.use(
      http.post(API_LOGIN_URL, () =>
        HttpResponse.json({
          role: "Rider",
          profile: { role: "", name: "No-Role-In-Profile" },
        }),
      ),
    );
    render(<RouterProvider router={buildRouter("/login")} />);
    await fillAndSubmit("0300000000", "any");
    expect(await screen.findByTestId("rider-home")).toBeInTheDocument();
  });
});

describe("F1 defense in depth — Customer seed login terminates cleanly", () => {
  it("logging in as Customer lands at /login with empty storage (no loop)", async () => {
    render(<RouterProvider router={buildRouter("/login")} />);
    await fillAndSubmit("0300444444", "customer");
    // roleHome('Customer') === '/login' → navigate('/login') → PublicOnly
    // detects unknown role → useEffect(logout) → envelope cleared. LoginPage
    // stays mounted. Test passes iff we don't throw "Maximum update depth".
    await waitFor(() => {
      expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
    // Login form still visible after the loop-break.
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});
