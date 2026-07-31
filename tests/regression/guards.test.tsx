import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  Navigate,
  RouterProvider,
  createMemoryRouter,
} from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute, PublicOnly } from "@/features/auth/ProtectedRoute";
import { IndexRedirect } from "@/router-layout";
import { saveSession } from "@/features/auth/session";
import type { Profile } from "@/types/profile";

const Stub = (id: string) => () => <div data-testid={id}>{id}</div>;
const LoginStub = Stub("login-page");
const RegisterStub = Stub("register-page");
const AdminStub = Stub("admin-page");
const RiderStub = Stub("rider-page");
const OperatorStub = Stub("operator-page");
const ActiveRidersStub = Stub("active-riders-page");
const PendingRidersStub = Stub("pending-riders-page");

function makeRouter(initial: string[]) {
  return createMemoryRouter(
    [
      {
        element: (
          <AuthProvider>
            <TestOutlet />
          </AuthProvider>
        ),
        children: [
          { index: true, element: <IndexRedirect /> },
          {
            element: <PublicOnly />,
            children: [
              { path: "login", element: <LoginStub /> },
              { path: "register", element: <RegisterStub /> },
            ],
          },
          {
            element: <ProtectedRoute allow={["Rider"]} />,
            children: [{ path: "rider", element: <RiderStub /> }],
          },
          {
            element: <ProtectedRoute allow={["Admin"]} />,
            children: [{ path: "admin", element: <AdminStub /> }],
          },
          {
            element: <ProtectedRoute allow={["Admin", "Operator"]} />,
            children: [
              { path: "admin/active-riders", element: <ActiveRidersStub /> },
              { path: "admin/pending-riders", element: <PendingRidersStub /> },
            ],
          },
          {
            element: <ProtectedRoute allow={["Operator"]} />,
            children: [{ path: "operator", element: <OperatorStub /> }],
          },
          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
    { initialEntries: initial },
  );
}

import { Outlet } from "react-router";
function TestOutlet() {
  return <Outlet />;
}

function renderAt(path: string) {
  return render(<RouterProvider router={makeRouter([path])} />);
}

function seedSession(profile: Profile) {
  saveSession(profile);
}

describe("guards (logged out) — deep-link protection", () => {
  it.each(["/admin", "/rider", "/operator", "/admin/active-riders", "/admin/pending-riders"])(
    "deep-link to %s while unauthed → /login",
    async (path) => {
      renderAt(path);
      expect(await screen.findByTestId("login-page")).toBeInTheDocument();
    },
  );
});

describe("guards (logged in) — role isolation", () => {
  it("Rider cannot reach /admin (bounced to /rider)", async () => {
    seedSession({ role: "Rider" });
    renderAt("/admin");
    expect(await screen.findByTestId("rider-page")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-page")).toBeNull();
  });

  it("F3 amendment: Admin AND Operator can reach /admin/active-riders", async () => {
    seedSession({ role: "Admin" });
    renderAt("/admin/active-riders");
    expect(await screen.findByTestId("active-riders-page")).toBeInTheDocument();
  });

  it("F3 amendment: Operator (not just Admin) can reach /admin/pending-riders", async () => {
    seedSession({ role: "Operator" });
    renderAt("/admin/pending-riders");
    expect(await screen.findByTestId("pending-riders-page")).toBeInTheDocument();
  });

  it("Rider cannot reach /admin/active-riders (Rider not in allow)", async () => {
    seedSession({ role: "Rider" });
    renderAt("/admin/active-riders");
    expect(await screen.findByTestId("rider-page")).toBeInTheDocument();
  });

  it("Case-insensitive role match (backend may return 'admin' or 'Admin')", async () => {
    seedSession({ role: "admin" });
    renderAt("/admin");
    expect(await screen.findByTestId("admin-page")).toBeInTheDocument();
  });
});

describe("PublicOnly — logged-in user hitting /login is bounced to role home", () => {
  it("Admin at /login → /admin", async () => {
    seedSession({ role: "Admin" });
    renderAt("/login");
    expect(await screen.findByTestId("admin-page")).toBeInTheDocument();
  });

  it("Operator at /register → /operator", async () => {
    seedSession({ role: "Operator" });
    renderAt("/register");
    expect(await screen.findByTestId("operator-page")).toBeInTheDocument();
  });
});

// Regression: an authenticated session carrying an unknown role must not
// send guards into a redirect loop. Each case below has to land on the login
// page (React Testing Library implicitly asserts termination — if the render
// loop never settled, it would throw "Maximum update depth exceeded") and
// the persisted session must be cleared by the useEffect logout inside
// PublicOnly.
describe("F1 — unknown-role authed users terminate on /login and log out", () => {
  it.each([
    ["Customer", { role: "Customer" }],
    ["empty string", { role: "" }],
    ["garbage", { role: "not-a-real-role" }],
  ])("%s: renders login, storage cleared, no infinite loop", async (_label, profile) => {
    seedSession(profile as Profile);
    renderAt("/admin");

    expect(await screen.findByTestId("login-page")).toBeInTheDocument();

    await waitFor(() => {
      expect(window.localStorage.getItem("rydee.session")).toBeNull();
    });
  });

  it("F1 also fires when the ONLY route entered is /login directly (rehydrated bad envelope)", async () => {
    seedSession({ role: "Customer" });
    renderAt("/login");
    expect(await screen.findByTestId("login-page")).toBeInTheDocument();
    await waitFor(() => {
      expect(window.localStorage.getItem("rydee.session")).toBeNull();
    });
  });
});
