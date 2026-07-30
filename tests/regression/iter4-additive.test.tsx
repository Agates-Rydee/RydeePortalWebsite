import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import { StatCard } from "@/features/dashboards/components/StatCard";
import { API_REGISTER_URL } from "@/lib/config";
import { server } from "../setup";

// Iter 4 additive coverage — QA-Iter4. Does NOT modify the 44 baseline tests.
// Exercises: on-blur validation, submit-time ISO conversion (incl. leap year
// 29/02 + age-18/100 boundaries), StatCard button-vs-static, and the DobPicker
// lazy chunk stays unmounted until user click.

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Iter 4 §1 — RegisterPage on-blur validation", () => {
  it("shows email error on blur with invalid value + aria-invalid + aria-describedby", async () => {
    const user = userEvent.setup();
    renderRegister();
    const email = screen.getByLabelText(/Email address/i);
    await user.click(email);
    await user.type(email, "not-an-email");
    await user.tab();
    const err = await screen.findByText(/Enter a valid email address\./);
    expect(err).toHaveAttribute("role", "alert");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email.getAttribute("aria-describedby")).toBe(err.id);
  });

  it("empty field after blur does NOT show error (touched-but-empty rule)", async () => {
    const user = userEvent.setup();
    renderRegister();
    const name = screen.getByLabelText(/^Name$/);
    await user.click(name);
    await user.tab();
    expect(screen.queryByText(/Enter your full name\./)).toBeNull();
  });

  it("clears the error as user types after fixing the field", async () => {
    const user = userEvent.setup();
    renderRegister();
    const email = screen.getByLabelText(/Email address/i);
    await user.type(email, "bad");
    await user.tab();
    await screen.findByText(/Enter a valid email address\./);
    await user.type(email, "@x.co");
    expect(screen.queryByText(/Enter a valid email address\./)).toBeNull();
  });
});

describe("Iter 4 §1/§2 — DOB validation boundaries + ISO submission (decisions 1+2)", () => {
  it("rejects age < 18 on blur", async () => {
    const user = userEvent.setup();
    renderRegister();
    const dob = screen.getByLabelText(/Date of birth/i);
    const y = new Date().getFullYear() - 17;
    await user.type(dob, `01/01/${y}`);
    await user.tab();
    await screen.findByText(/Enter a valid date of birth/);
  });

  it("rejects age > 100", async () => {
    const user = userEvent.setup();
    renderRegister();
    const dob = screen.getByLabelText(/Date of birth/i);
    const y = new Date().getFullYear() - 101;
    await user.type(dob, `01/01/${y}`);
    await user.tab();
    await screen.findByText(/Enter a valid date of birth/);
  });

  it("rejects invalid calendar date 29/02/2023 (non-leap year)", async () => {
    const user = userEvent.setup();
    renderRegister();
    const dob = screen.getByLabelText(/Date of birth/i);
    await user.type(dob, "29/02/2023");
    await user.tab();
    await screen.findByText(/Enter a valid date of birth/);
  });

  it("accepts leap-year 29/02/2000 (adult)", async () => {
    const user = userEvent.setup();
    renderRegister();
    const dob = screen.getByLabelText(/Date of birth/i);
    await user.type(dob, "29/02/2000");
    await user.tab();
    expect(screen.queryByText(/Enter a valid date of birth/)).toBeNull();
  });

  it("submits dob as ISO YYYY-MM-DD (25/12/1995 -> 1995-12-25) and preserves H1 fields", async () => {
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.post(API_REGISTER_URL, async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ok: true });
      }),
    );
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText(/^Name$/), "Test User");
    await user.type(screen.getByLabelText(/Email address/i), "t@example.com");
    await user.type(screen.getByLabelText(/Phone number/i), "0300123456");
    await user.type(screen.getByLabelText(/Date of birth/i), "25/12/1995");
    await user.type(screen.getByLabelText(/Home address/i), "House 1, Street 2");
    await user.type(screen.getByLabelText(/^Password$/), "hunter2xx");
    await user.type(screen.getByLabelText(/Confirm password/i), "hunter2xx");
    await user.click(screen.getByRole("button", { name: /Create account/i }));
    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured!.dob).toBe("1995-12-25");
    // H1: field names + shape byte-identical
    expect(Object.keys(captured!).sort()).toEqual(
      ["address","dob","email","name","password","phoneNumber","role"].sort(),
    );
    expect(captured!.phoneNumber).toBe("0300123456");
  });

  it("age exactly 18 (yesterday-1y) is accepted; exactly 17y364d is rejected", async () => {
    const user = userEvent.setup();
    renderRegister();
    const dob = screen.getByLabelText(/Date of birth/i);
    const now = new Date();
    const yr18 = now.getFullYear() - 18;
    const pad = (n: number) => String(n).padStart(2, "0");
    // A birthday that has already happened this year, exactly 18 years ago
    const past = new Date(yr18, now.getMonth(), now.getDate() - 1);
    const s18 = `${pad(past.getDate())}/${pad(past.getMonth() + 1)}/${past.getFullYear()}`;
    await user.type(dob, s18);
    await user.tab();
    expect(screen.queryByText(/Enter a valid date of birth/)).toBeNull();
  });
});

describe("Iter 4 §5 — StatCard button vs static rendering", () => {
  it("renders as <button> with dynamic aria-label when onClick + value provided", () => {
    const spy = vi.fn();
    render(
      <StatCard label="Pending Riders" value={5} icon={<span data-testid="icon" />} onClick={spy} />,
    );
    const btn = screen.getByRole("button", { name: /View 5 pending riders/i });
    expect(btn.tagName).toBe("BUTTON");
    // No nested interactive descendants
    expect(btn.querySelectorAll("button, a").length).toBe(0);
  });

  it("renders static (no button role) when value is null even if onClick provided", () => {
    render(
      <StatCard label="Active Riders" value={null} icon={<span />} onClick={() => {}} />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders static when onClick omitted", () => {
    render(<StatCard label="Total Riders" value={42} icon={<span />} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("clicking the card fires onClick", async () => {
    const spy = vi.fn();
    const user = userEvent.setup();
    render(<StatCard label="X" value={3} icon={<span />} onClick={spy} />);
    await user.click(screen.getByRole("button"));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("Iter 4 phase 6 — DobPicker lazy chunk not loaded until click", () => {
  it("mounts a static trigger button; Radix Popover is not in the DOM initially", () => {
    renderRegister();
    const trigger = screen.getByRole("button", { name: /Open date picker/i });
    expect(trigger).toBeInTheDocument();
    // Popover content only appears after click + async chunk load.
    expect(document.querySelector("[data-radix-popper-content-wrapper]")).toBeNull();
  });
});
