// The date-picker popover is difficult to drive through userEvent inside
// jsdom, so it is stubbed with a plain input that emits the same DD/MM/YYYY
// string contract the real component produces.
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import {
  Outlet,
  RouterProvider,
  createMemoryRouter,
} from "react-router";

vi.mock("@/components/DatePickerField", () => ({
  DatePickerField: ({
    id,
    value,
    onChange,
  }: {
    id: string;
    value: Date | undefined;
    onChange: (d: Date | undefined) => void;
  }) => (
    <input
      id={id}
      aria-label="Date of birth"
      defaultValue={value ? value.toISOString().slice(0, 10) : ""}
      onChange={(e) => {
        // Test contract: type ISO YYYY-MM-DD; convert to Date and hand back.
        const v = e.target.value;
        onChange(v ? new Date(v) : undefined);
      }}
    />
  ),
}));

import { AuthProvider } from "@/features/auth/AuthProvider";
import RegisterPage from "@/features/auth/pages/RegisterPage";

function Layout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

function buildRouter() {
  return createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <div data-testid="home">home</div> },
          { path: "register", element: <RegisterPage /> },
          {
            path: "login",
            element: <div data-testid="login-page">login</div>,
          },
        ],
      },
    ],
    // History: home → register (index 1). After successful register with
    // replace:true, history should be [home, login]. Going back lands on
    // home, NOT register (that's the whole D16 point).
    { initialEntries: ["/", "/register"], initialIndex: 1 },
  );
}

// ~25 years ago in ISO; passes 18–100 validator regardless of test date.
function isoDobFor25(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return d.toISOString().slice(0, 10);
}

describe("D16 — post-register navigation uses replace:true", () => {
  it(
    "successful registration replaces /register with /login (back → home, not /register)",
    { timeout: 20000 },
    async () => {
      const user = userEvent.setup();
      const router = buildRouter();
      render(<RouterProvider router={router} />);

      await user.type(screen.getByLabelText(/^name$/i), "New User");
      await user.type(screen.getByLabelText(/email address/i), "new@example.com");
      await user.type(screen.getByLabelText(/phone number/i), "0300123456");
      await user.type(screen.getByLabelText(/date of birth/i), isoDobFor25());
      await user.type(screen.getByLabelText(/home address/i), "DHA Karachi");
      // Role: not visible in public /register form; defaults to "rider".
      await user.type(screen.getByLabelText(/^password$/i), "hunter2!");
      await user.type(screen.getByLabelText(/confirm password/i), "hunter2!");

      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(
        () => {
          expect(screen.getByTestId("login-page")).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // D16 assertion: back-button does NOT return to /register.
      router.navigate(-1);
      await waitFor(() => {
        expect(screen.getByTestId("home")).toBeInTheDocument();
      });
      expect(router.state.location.pathname).toBe("/");
    },
  );
});
