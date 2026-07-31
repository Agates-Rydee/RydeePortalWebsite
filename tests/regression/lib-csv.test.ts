import { describe, expect, it } from "vitest";
import { csvEscape, serializeCsv } from "@/lib/csv";

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

describe("serializeCsv", () => {
  it("joins header + rows with CRLF and escapes every cell", () => {
    const out = serializeCsv(
      ["A", "B,c"],
      [
        ["1", "two"],
        ["has,comma", 'has"quote'],
      ],
    );
    expect(out).toBe('A,"B,c"\r\n1,two\r\n"has,comma","has""quote"');
  });

  it("returns just the header line when there are no rows", () => {
    expect(serializeCsv(["A", "B"], [])).toBe("A,B");
  });
});
