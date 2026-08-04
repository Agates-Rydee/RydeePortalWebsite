import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Navigate, RouterProvider, createMemoryRouter, Outlet } from "react-router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { saveSession } from "@/features/auth/session";
import { API_GET_ALL_RIDERS_URL } from "@/api/riders";
import { AllRidersRoute } from "@/features/riders/routes";
import { server } from "../setup";

const seedRiders: Array<Record<string, unknown>> = [
  { id: 1, name: "Alice Ahmed",   phone: "0300-1000001", cnic: "42101-1000001-1", activation_status: "active",     area: "DHA",     joinedAt: "2026-07-25" },
  { id: 2, name: "Bob Bhatti",    phone: "0300-1000002", cnic: "42101-1000002-2", activation_status: "pending",    rideArea: "Clifton", joinedAt: "2026-07-24" },
  { id: 3, name: "Carol Chen",    phone: "0300-1000003", cnic: "42101-1000003-3", activated: true,                 area: "Saddar",  joinedAt: "2026-07-23" },
  { id: 4, name: "Danish Dar",    phone: "0300-1000004", cnic: "42101-1000004-4", activation_status: "blocked",    area: "Malir",   joinedAt: "2026-07-22" },
  { id: 5, name: "Erum Eshan",    phone: "0300-1000005", cnic: "42101-1000005-5", activation_status: "offboarded", area: "Korangi", joinedAt: "2026-07-21" },
  { id: 6, name: "Farhan Faisal", phone: "0300-1000006", cnic: "42101-1000006-6", activation_status: "active",     area: "Nazimabad", joinedAt: "2026-07-20" },
  { id: 7, name: "Gohar Gill",    phone: "0300-1000007", cnic: "42101-1000007-7", activation_status: "active",     area: "PECHS",   joinedAt: "2026-07-19" },
  { id: 8, name: "Hina Hussain",  phone: "0300-1000008", cnic: "42101-1000008-8", activation_status: "pending",    area: "Orangi",  joinedAt: "2026-07-18" },
  { id: 9, name: "Imran Iqbal",   phone: "0300-1000009", cnic: "42101-1000009-9", activation_status: "active",     area: "Landhi",  joinedAt: "2026-07-17" },
  { id: 10, name: "Junaid Jamal", phone: "0300-1000010", cnic: "42101-1000010-0", activation_status: "active",     area: "DHA",     joinedAt: "2026-07-16" },
  { id: 11, name: "Khalil Khan",  phone: "0300-1000011", cnic: "42101-1000011-1", activation_status: "active",     area: "Clifton", joinedAt: "2026-07-15" },
  { id: 12, name: "Laila Latif",  phone: "0300-1000012", cnic: "42101-1000012-2", activation_status: "active",     area: "Saddar",  joinedAt: "2026-07-14" },
];

function mockRiders(rows: unknown[] = seedRiders) {
  server.use(
    http.post(API_GET_ALL_RIDERS_URL, () => HttpResponse.json({ riders: rows })),
  );
}

function renderRoute({ role = "Admin", path = "/admin/all-riders" }: { role?: string; path?: string } = {}) {
  saveSession({ role });
  const router = createMemoryRouter(
    [
      {
        element: (
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        ),
        children: [
          {
            element: <ProtectedRoute allow={["Admin", "Operator"]} />,
            children: [
              { path: "admin/all-riders", element: <AllRidersRoute /> },
            ],
          },
          { path: "login", element: <div data-testid="login-page">login</div> },
          { path: "rider", element: <div data-testid="rider-page">rider</div> },
          { path: "*", element: <Navigate to="/login" replace /> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe("AllRiders — data load + rendering", () => {
  it("renders rows after fetch and honors wire aliases (rideArea + activated boolean)", async () => {
    mockRiders();
    renderRoute();
    expect(await screen.findByText("Bob Bhatti")).toBeInTheDocument();
    const bobRow = screen.getByText("Bob Bhatti").closest("tr")!;
    expect(within(bobRow).getByText("Clifton")).toBeInTheDocument();
    const carolRow = screen.getByText("Carol Chen").closest("tr")!;
    expect(within(carolRow).getByText("Active")).toBeInTheDocument();
  });

  it("empty-state clear-filters affordance restores default view", async () => {
    mockRiders();
    const user = userEvent.setup();
    renderRoute();
    const search = await screen.findByLabelText(/search riders/i);
    await user.type(search, "zzz-nonexistent");
    await waitFor(() =>
      expect(screen.getByText(/no riders found/i)).toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    await waitFor(() =>
      expect(screen.getByText("Alice Ahmed")).toBeInTheDocument(),
    );
  });

  it("error state renders role=alert with server text verbatim", async () => {
    server.use(
      http.post(API_GET_ALL_RIDERS_URL, () =>
        HttpResponse.text("Backend on fire", { status: 500 }),
      ),
    );
    renderRoute();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Backend on fire");
  });
});

describe("AllRiders — status tabs + live counts", () => {
  it("shows correct per-tab counts and filters rows", async () => {
    mockRiders();
    const user = userEvent.setup();
    renderRoute();
    await screen.findByText("Alice Ahmed");
    expect(screen.getByTestId("fqa-count-all")).toHaveTextContent("12");
    expect(screen.getByTestId("fqa-count-active")).toHaveTextContent("8");
    expect(screen.getByTestId("fqa-count-pending")).toHaveTextContent("2");
    expect(screen.getByTestId("fqa-count-blocked")).toHaveTextContent("1");
    expect(screen.getByTestId("fqa-count-offboarded")).toHaveTextContent("1");

    await user.click(screen.getByRole("tab", { name: /blocked/i }));
    expect(screen.getByText("Danish Dar")).toBeInTheDocument();
    expect(screen.queryByText("Alice Ahmed")).toBeNull();
  });
});

describe("AllRiders — search (debounced 300ms) across name/phone/CNIC", () => {
  it("matches name after debounce", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockRiders();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderRoute();
    await screen.findByText("Alice Ahmed");
    const search = screen.getByLabelText(/search riders/i);
    await user.type(search, "farhan");
    // The 300 ms debounce has not yet elapsed, so the visible list should
    // still show the pre-typing rows.
    expect(screen.getByText("Alice Ahmed")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(350);
    });
    await waitFor(() => expect(screen.queryByText("Alice Ahmed")).toBeNull());
    expect(screen.getByText("Farhan Faisal")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("matches phone and CNIC substrings", async () => {
    mockRiders();
    const user = userEvent.setup();
    renderRoute();
    await screen.findByText("Alice Ahmed");
    const search = screen.getByLabelText(/search riders/i);
    await user.type(search, "1000004");
    await waitFor(() => {
      expect(screen.getByText("Danish Dar")).toBeInTheDocument();
      expect(screen.queryByText("Alice Ahmed")).toBeNull();
    });
    await user.clear(search);
    await user.type(search, "42101-1000005");
    await waitFor(() => {
      expect(screen.getByText("Erum Eshan")).toBeInTheDocument();
      expect(screen.queryByText("Danish Dar")).toBeNull();
    });
  });
});

describe("AllRiders — sort cycle + aria-sort", () => {
  it("cycles unsorted → asc → desc → unsorted (default) with aria-sort", async () => {
    mockRiders();
    const user = userEvent.setup();
    renderRoute();
    await screen.findByText("Alice Ahmed");
    const nameHeader = screen.getByRole("columnheader", { name: /name/i });
    expect(nameHeader).toHaveAttribute("aria-sort", "none");
    const button = within(nameHeader).getByRole("button");

    await user.click(button);
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    await user.click(button);
    expect(nameHeader).toHaveAttribute("aria-sort", "descending");
    await user.click(button);
    expect(nameHeader).toHaveAttribute("aria-sort", "none");
  });
});

describe("AllRiders — pagination resets on filter/tab/search change", () => {
  it("changing tab from a non-first page resets to page 1", async () => {
    mockRiders();
    const user = userEvent.setup();
    renderRoute();
    await screen.findByText("Alice Ahmed");
    await user.click(screen.getByRole("button", { name: /next page/i }));
    expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /^active/i }));
    expect(screen.queryByText(/page 2 of 2/i)).not.toBeInTheDocument();
    const nextBtn = screen.getByRole("button", { name: /next page/i });
    expect(nextBtn).toBeDisabled();
  });
});

describe("AllRiders — route guard", () => {
  it("Admin can reach /admin/all-riders", async () => {
    mockRiders();
    renderRoute({ role: "Admin" });
    expect(await screen.findByText(/all riders/i)).toBeInTheDocument();
  });

  it("Operator can also reach /admin/all-riders (ADR-0004 allow=[Admin,Operator])", async () => {
    mockRiders();
    renderRoute({ role: "Operator" });
    expect(await screen.findByText(/all riders/i)).toBeInTheDocument();
  });

  it("Rider is bounced away (not in allow)", async () => {
    mockRiders();
    renderRoute({ role: "Rider" });
    expect(await screen.findByTestId("rider-page")).toBeInTheDocument();
  });
});

describe("AllRiders — Export button (E2)", () => {
  it("has label 'Export CSV' with filtered count in aria-label", async () => {
    mockRiders();
    renderRoute();
    await screen.findByText("Alice Ahmed");
    const btn = screen.getByRole("button", { name: /export csv \(12 rows\)/i });
    expect(btn).toHaveTextContent(/^Export CSV$/);
    expect(btn).not.toBeDisabled();
  });

  it("disables when filtered set is empty", async () => {
    mockRiders();
    const user = userEvent.setup();
    renderRoute();
    const search = await screen.findByLabelText(/search riders/i);
    await user.type(search, "zzz-nonexistent");
    await waitFor(() =>
      expect(screen.getByText(/no riders found/i)).toBeInTheDocument(),
    );
    const btn = screen.getByRole("button", { name: /export csv \(0 rows\)/i });
    expect(btn).toBeDisabled();
  });
});

describe("AllRiders — pagination summary aria-live (E3)", () => {
  it("visible summary is plain text (no role=status, no aria-live)", async () => {
    mockRiders();
    renderRoute();
    await screen.findByText("Alice Ahmed");
    const nodes = screen.getAllByText(/showing 1–10 of 12 riders/i);
    const visible = nodes.find((n) => n.tagName.toLowerCase() === "p");
    // A previous version placed role=status and aria-live=polite on the
    // visible paragraph, which caused an announcement on every keystroke; this
    // assertion locks in that the visible paragraph is now plain text.
    expect(visible).toBeTruthy();
    expect(visible!.getAttribute("role")).toBeNull();
    expect(visible!.getAttribute("aria-live")).toBeNull();
  });

  it("still exposes the summary via a sr-only live region for AT", async () => {
    mockRiders();
    renderRoute();
    await screen.findByText("Alice Ahmed");
    const nodes = screen.getAllByText(/showing 1–10 of 12 riders/i);
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    const live = nodes.find((n) => n.getAttribute("aria-live") === "polite");
    expect(live).toBeTruthy();
    expect(live!.className).toMatch(/sr-only/);
  });
});

describe("AllRiders — URL-persisted filters (F1)", () => {
  it("hydrates state from URL on mount (status + q + sort + page + pageSize)", async () => {
    mockRiders();
    renderRoute({
      path: "/admin/all-riders?status=active&q=carol&sort=name&dir=asc&pageSize=25",
    });
    const search = await screen.findByLabelText(/search riders/i);
    expect(search).toHaveValue("carol");
    const activeTab = screen.getByRole("tab", { name: /^active/i });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
    const nameHeader = screen.getByRole("columnheader", { name: /name/i });
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByLabelText(/rows per page/i)).toHaveValue("25");
  });

  it("writes state to URL as filters change; defaults omitted", async () => {
    mockRiders();
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          element: (
            <AuthProvider>
              <Outlet />
            </AuthProvider>
          ),
          children: [
            {
              element: <ProtectedRoute allow={["Admin", "Operator"]} />,
              children: [
                { path: "admin/all-riders", element: <AllRidersRoute /> },
              ],
            },
          ],
        },
      ],
      { initialEntries: ["/admin/all-riders"] },
    );
    saveSession({ role: "Admin" });
    render(<RouterProvider router={router} />);
    await screen.findByText("Alice Ahmed");
    expect(router.state.location.search).toBe("");
    await user.click(screen.getByRole("tab", { name: /blocked/i }));
    await waitFor(() => {
      expect(router.state.location.search).toMatch(/status=blocked/);
    });
    await user.click(screen.getByRole("tab", { name: /^all/i }));
    await waitFor(() => {
      expect(router.state.location.search).not.toMatch(/status=/);
    });
  });

  it("invalid params fall back to defaults silently", async () => {
    mockRiders();
    renderRoute({
      path: "/admin/all-riders?status=garbage&sort=bogus&dir=weird&pageSize=999&page=-4",
    });
    await screen.findByText("Alice Ahmed");
    const allTab = screen.getByRole("tab", { name: /^all/i });
    expect(allTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText(/rows per page/i)).toHaveValue("10");
  });
});

describe("AllRiders — row → detail Sheet (F3)", () => {
  it("clicking a row opens the Sheet with rider content", async () => {
    mockRiders();
    const user = userEvent.setup();
    renderRoute();
    const row = (await screen.findByText("Alice Ahmed")).closest("tr")!;
    await user.click(row);
    const sheet = await screen.findByTestId("fqa-rider-detail-sheet");
    expect(sheet).toBeInTheDocument();
    expect(within(sheet).getByRole("heading", { name: "Alice Ahmed" })).toBeInTheDocument();
    expect(within(sheet).getByText("0300-1000001")).toBeInTheDocument();
    expect(within(sheet).getByText("42101-1000001-1")).toBeInTheDocument();
    expect(within(sheet).getByText("DHA")).toBeInTheDocument();
    expect(within(sheet).getAllByText("—").length).toBeGreaterThan(0);
  });

  it("Enter on a focused row opens the Sheet", async () => {
    mockRiders();
    const user = userEvent.setup();
    renderRoute();
    const row = (await screen.findByText("Bob Bhatti")).closest("tr")!;
    row.focus();
    expect(row).toHaveFocus();
    await user.keyboard("{Enter}");
    const sheet = await screen.findByTestId("fqa-rider-detail-sheet");
    expect(within(sheet).getByRole("heading", { name: "Bob Bhatti" })).toBeInTheDocument();
  });

  it("Escape closes the Sheet", async () => {
    mockRiders();
    const user = userEvent.setup();
    renderRoute();
    const row = (await screen.findByText("Alice Ahmed")).closest("tr")!;
    await user.click(row);
    await screen.findByTestId("fqa-rider-detail-sheet");
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByTestId("fqa-rider-detail-sheet")).toBeNull();
    });
  });
});
