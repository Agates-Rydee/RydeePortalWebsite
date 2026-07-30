// F2 (major security regression, QA C5): ROLES must never include Admin.
// H3: Customer seed (0300444444) is the F1 regression tripwire and must
// remain present in the MSW handlers.
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ROLES, roleHome } from "@/types/profile";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import { API_LOGIN_URL } from "@/lib/config";

describe("F2 — ROLES contract (never widen)", () => {
  it("ROLES is exactly ['Operator','Customer','Rider']", () => {
    // Hard equality on both the set of values AND the order. Set order is
    // the ADR-anchored source of truth for the /admin/register dropdown.
    expect([...ROLES]).toEqual(["Operator", "Customer", "Rider"]);
  });

  it("does NOT contain 'Admin' — the F2 security regression tripwire", () => {
    for (const r of ROLES) {
      expect(r.toLowerCase()).not.toBe("admin");
    }
    // Fail loudly if anyone tries to sneak it back in with a widened type.
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
    // Positive: the three real roles ARE offered.
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
    // Confirms the F1 unknown-role path is exercisable end-to-end:
    // roleHome("Customer") is /login → PublicOnly must logout on rehydrate.
    expect(roleHome(data.profile.role)).toBe("/login");
  });
});
