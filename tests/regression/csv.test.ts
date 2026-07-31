import { describe, expect, it } from "vitest";
import {
  csvEscape,
  csvFilename,
  CSV_HEADERS,
  ridersToCsv,
  todayIso,
} from "@/features/riders/csv";
import type { AllRidersRow } from "@/types/rider";

describe("csvEscape (RFC-4180)", () => {
  it("passes plain fields through untouched", () => {
    expect(csvEscape("hello")).toBe("hello");
    expect(csvEscape("Muhammad Imran")).toBe("Muhammad Imran");
    expect(csvEscape("")).toBe("");
  });

  it("quotes fields containing a comma", () => {
    expect(csvEscape("Karachi, DHA")).toBe('"Karachi, DHA"');
  });

  it("quotes fields containing double-quote and doubles the inner quote", () => {
    expect(csvEscape('He said "hi"')).toBe('"He said ""hi"""');
  });

  it("quotes fields containing CR or LF", () => {
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
    expect(csvEscape("line1\r\nline2")).toBe('"line1\r\nline2"');
  });
});

describe("ridersToCsv", () => {
  it("emits header row + CRLF line endings + escaped fields", () => {
    const rows: AllRidersRow[] = [
      {
        id: 1,
        name: 'Imran, "The Boss"',
        phone: "0300-1111111",
        cnic: "42101-1111111-1",
        status: "active",
        area: "DHA\nPhase 5",
        joinedAt: "2026-07-20",
      },
    ];
    const csv = ridersToCsv(rows);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(CSV_HEADERS.join(","));
    // First data row: the name field contains a comma and quote (must be wrapped and doubled), and the area contains a newline (must be wrapped).
    expect(lines[1]).toBe(
      '"Imran, ""The Boss""",0300-1111111,42101-1111111-1,Active,"DHA\nPhase 5",2026-07-20',
    );
  });

  it("header-only output when rows are empty", () => {
    expect(ridersToCsv([])).toBe(CSV_HEADERS.join(","));
  });
});

describe("csvFilename", () => {
  it("uses status tab + local YYYY-MM-DD", () => {
    const d = new Date(2026, 6, 31); // month is 0-indexed → July
    expect(csvFilename("blocked", d)).toBe("rydee-riders-blocked-2026-07-31.csv");
    expect(csvFilename("all", d)).toBe("rydee-riders-all-2026-07-31.csv");
  });

  it("zero-pads month and day", () => {
    const d = new Date(2026, 0, 5);
    expect(todayIso(d)).toBe("2026-01-05");
  });
});
