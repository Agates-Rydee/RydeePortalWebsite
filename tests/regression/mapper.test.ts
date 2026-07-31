// ADR-0004 — wire → domain mapper unit tests. Alias rules must mirror
// PendingRiders.toPendingRider (see mapper.ts header).
import { describe, expect, it, vi } from "vitest";
import { mapAllRidersResponse, toAllRidersRow } from "@/features/riders/mapper";

describe("toAllRidersRow — alias resolution", () => {
  it("prefers `area` over `rideArea` when both are present", () => {
    const r = toAllRidersRow({ area: "DHA", rideArea: "Clifton", activation_status: "active" }, 0);
    expect(r.area).toBe("DHA");
  });

  it("falls back to `rideArea` when `area` is missing", () => {
    const r = toAllRidersRow({ rideArea: "Clifton", activation_status: "active" }, 0);
    expect(r.area).toBe("Clifton");
  });

  it("falls back to `rideArea` when `area` is empty string", () => {
    const r = toAllRidersRow({ area: "", rideArea: "Clifton", activation_status: "active" }, 0);
    expect(r.area).toBe("Clifton");
  });

  it("uses idx+1 when id is missing", () => {
    const r = toAllRidersRow({ name: "X" }, 4);
    expect(r.id).toBe(5);
  });
});

describe("toAllRidersRow — status resolution", () => {
  it("non-empty activation_status wins (case-insensitive)", () => {
    expect(toAllRidersRow({ activation_status: "BLOCKED", activated: true }, 0).status).toBe("blocked");
    expect(toAllRidersRow({ activation_status: "Offboarded" }, 0).status).toBe("offboarded");
  });

  it("activated===true → active when no activation_status", () => {
    expect(toAllRidersRow({ activated: true }, 0).status).toBe("active");
  });

  it("defaults to pending when neither is present", () => {
    expect(toAllRidersRow({}, 0).status).toBe("pending");
    expect(toAllRidersRow({ activated: false }, 0).status).toBe("pending");
  });

  it("unknown status literal → pending + console.warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(toAllRidersRow({ activation_status: "banished" }, 0).status).toBe("pending");
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("accepts camelCase `activationStatus` variant", () => {
    expect(toAllRidersRow({ activationStatus: "blocked" }, 0).status).toBe("blocked");
  });
});

describe("mapAllRidersResponse", () => {
  it("maps an array end-to-end", () => {
    const rows = mapAllRidersResponse([
      { id: 1, name: "A", phone: "1", cnic: "c1", activation_status: "active", area: "DHA", joinedAt: "2026-07-01" },
      { id: 2, name: "B", phone: "2", cnic: "c2", activated: true, rideArea: "Clifton", joinedAt: "2026-07-02" },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].status).toBe("active");
    expect(rows[1].status).toBe("active");
    expect(rows[1].area).toBe("Clifton");
  });
});
