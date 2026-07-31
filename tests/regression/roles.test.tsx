import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ROLES, roleHome } from "@/types/profile";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import { API_LOGIN_URL } from "@/lib/config";

describe("F2 — ROLES contract (never widen)", () => {
  it("ROLES is exactly ['Operator','Customer','Rider']", () => {
    // The exact order matters: it drives the option order in the admin
    // register dropdown, which regression-sensitive tests depend on.
    expect([...ROLES]).toEqual(["Operator", "Customer", "Rider"]);
  });

  it("does NOT contain 'Admin' — the F2 security regression tripwire", () => {
    for (const r of ROLES) {
      expect(r.toLowerCase()).not.toBe("admin");
    }
    expect((ROLES as readonly string[]).includes("Admin")).toBe(false);
  });

  it("/admin/register role dropdown never offers Admin", () => {
    render(
      <MemoryRouter>
        <RegisterPage showRole backTo="/admin" />
      </MemoryRouter>,
    );
    const select = screen.getByLabelText(/role/i) as HTMLSelectElement;
    const options = within(select)
      .getAllByRole("option")
      .map((o) => (o as HTMLOptionElement).value.toLowerCase());
    expect(options).not.toContain("admin");
    expect(options).toEqual(expect.arrayContaining(["operator", "customer", "rider"]));
  });
});

describe("H3 — Customer seed (F1 tripwire) present in MSW handlers", () => {
  it("phone 0300444444 / password 'customer' authenticates as Customer", async () => {
    const res = await fetch(API_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0300444444", password: "customer" }),
      credentials: "include",
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { profile: { role: string } };
    expect(data.profile.role).toBe("Customer");
    // Customer maps to /login in roleHome, so a rehydrated Customer session
    // must trigger the PublicOnly logout path rather than looping back through
    // the guards.
    expect(roleHome(data.profile.role)).toBe("/login");
  });
});
