import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import { StatCard } from "@/features/dashboards/components/StatCard";
import { API_REGISTER_URL } from "@/api/auth";
import { server } from "../setup";

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

describe("Iter 4.1 hotfix — DOB DatePickerField (button-trigger pattern)", () => {
  it("renders the outline button trigger with the muted DD/MM/YYYY placeholder", () => {
    renderRegister();
    const trigger = screen.getByLabelText(/Date of birth/i);
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveTextContent("DD/MM/YYYY");
    expect(trigger).toHaveAttribute("id", "reg-dob");
  });

  it("blocks submit + focuses the empty dob trigger when the user has not picked a date", async () => {
    let called = false;
    server.use(
      http.post(API_REGISTER_URL, async () => {
        called = true;
        return HttpResponse.json({ ok: true });
      }),
    );
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText(/^Name$/), "Test User");
    await user.type(screen.getByLabelText(/Email address/i), "t@example.com");
    await user.type(screen.getByLabelText(/Phone number/i), "0300123456");
    await user.type(screen.getByLabelText(/Home address/i), "House 1, Street 2");
    await user.type(screen.getByLabelText(/^Password$/), "hunter2xx");
    await user.type(screen.getByLabelText(/Confirm password/i), "hunter2xx");
    await user.click(screen.getByRole("button", { name: /Create account/i }));
    const err = await screen.findByText(/Enter a valid date of birth/);
    expect(err).toHaveAttribute("role", "alert");
    expect(called).toBe(false);
    expect(document.activeElement).toBe(screen.getByLabelText(/Date of birth/i));
  });

  it("aria-invalid wires to the trigger button when validation fails", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByLabelText(/^Name$/), "Test User");
    await user.type(screen.getByLabelText(/Email address/i), "t@example.com");
    await user.type(screen.getByLabelText(/Phone number/i), "0300123456");
    await user.type(screen.getByLabelText(/Home address/i), "House 1, Street 2");
    await user.type(screen.getByLabelText(/^Password$/), "hunter2xx");
    await user.type(screen.getByLabelText(/Confirm password/i), "hunter2xx");
    await user.click(screen.getByRole("button", { name: /Create account/i }));
    const trigger = screen.getByLabelText(/Date of birth/i);
    await waitFor(() => expect(trigger).toHaveAttribute("aria-invalid", "true"));
    expect(trigger.getAttribute("aria-describedby")).toBe("reg-dob-error");
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

describe("Iter 4.4 — DatePickerField popover subtree gated on click", () => {
  it("mounts a static outline trigger; Radix PopoverContent is absent until clicked", async () => {
    const user = userEvent.setup();
    renderRegister();
    const trigger = screen.getByLabelText(/Date of birth/i);
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveTextContent("DD/MM/YYYY");
    expect(document.querySelector("[data-radix-popper-content-wrapper]")).toBeNull();
    await user.click(trigger);
    await waitFor(() =>
      expect(document.querySelector("[data-radix-popper-content-wrapper]")).not.toBeNull(),
    );
  });
});
