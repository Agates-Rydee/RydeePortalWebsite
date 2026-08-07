import { describe, expect, it } from "vitest";
import { validateEnvironment } from "@/lib/env";

const validSource = {
  VITE_API_BASE_URL: "http://localhost:3000",
  VITE_ENABLE_MSW: "true",
};

describe("validateEnvironment", () => {
  it("accepts a fully populated environment", () => {
    const result = validateEnvironment(validSource);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.VITE_API_BASE_URL).toBe("");
      expect(result.values.VITE_ENABLE_MSW).toBe("true");
    }
  });

  it("reports both variables as missing when the .env file is absent", () => {
    const result = validateEnvironment({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const names = result.problems.map((problem) => problem.name).sort();
      expect(names).toEqual(["VITE_API_BASE_URL", "VITE_ENABLE_MSW"]);
      for (const problem of result.problems) {
        expect(problem.kind).toBe("missing");
      }
    }
  });

  it("accepts an empty VITE_API_BASE_URL as valid (same-origin / dev-proxy mode)", () => {
    const result = validateEnvironment({
      ...validSource,
      VITE_API_BASE_URL: "",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.VITE_API_BASE_URL).toBe("");
    }
  });

  it("rejects a base URL that does not parse", () => {
    const result = validateEnvironment({
      ...validSource,
      VITE_API_BASE_URL: "not-a-url",
      VITE_ENABLE_MSW: "false",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems).toHaveLength(1);
      const [problem] = result.problems;
      expect(problem.name).toBe("VITE_API_BASE_URL");
      expect(problem.kind).toBe("invalid");
    }
  });

  it("rejects a base URL that lacks an http(s) scheme", () => {
    // Bare host:port strings parse via WHATWG URL only inconsistently, so the guard rejects anything without http or https regardless of parseability.
    const result = validateEnvironment({
      ...validSource,
      VITE_API_BASE_URL: "ftp://example.com",
      VITE_ENABLE_MSW: "false",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const [problem] = result.problems;
      expect(problem.kind).toBe("invalid");
      if (problem.kind === "invalid") {
        expect(problem.reason).toMatch(/http/);
        expect(problem.value).toBe("ftp://example.com");
      }
    }
  });

  it("rejects VITE_ENABLE_MSW values other than the literal true or false", () => {
    const result = validateEnvironment({
      ...validSource,
      VITE_ENABLE_MSW: "yes",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const [problem] = result.problems;
      expect(problem.name).toBe("VITE_ENABLE_MSW");
      expect(problem.kind).toBe("invalid");
    }
  });

  it("accepts VITE_ENABLE_MSW=false as a valid disabled state", () => {
    const result = validateEnvironment({
      ...validSource,
      VITE_ENABLE_MSW: "false",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.VITE_ENABLE_MSW).toBe("false");
    }
  });

  it("collects multiple problems in a single pass", () => {
    // Every field is classified before returning so a single run reports ALL problems at once, not just the first.
    const result = validateEnvironment({
      VITE_API_BASE_URL: "not-a-url",
      VITE_ENABLE_MSW: "maybe",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problems).toHaveLength(2);
      const byName = Object.fromEntries(
        result.problems.map((problem) => [problem.name, problem.kind]),
      );
      expect(byName).toEqual({
        VITE_API_BASE_URL: "invalid",
        VITE_ENABLE_MSW: "invalid",
      });
    }
  });

  it("distinguishes missing from empty in a mixed failure report", () => {
    const result = validateEnvironment({
      VITE_API_BASE_URL: undefined,
      VITE_ENABLE_MSW: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const byName = Object.fromEntries(
        result.problems.map((problem) => [problem.name, problem.kind]),
      );
      expect(byName).toEqual({
        VITE_API_BASE_URL: "missing",
        VITE_ENABLE_MSW: "empty",
      });
    }
  });

  it("guards against a trailing slash on the base URL producing double slashes when consumers join a path (contract note)", () => {
    // Trailing-slash normalisation lives in the API client, not in the validator, so a trailing slash must still be accepted here.
    const result = validateEnvironment({
      ...validSource,
      VITE_API_BASE_URL: "http://localhost:3000/",
    });
    expect(result.ok).toBe(true);
  });
});
