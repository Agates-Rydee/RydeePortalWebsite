// Vitest global setup — D12 test foundation.
//
// The whole point of this file: boot an msw/node server against the EXACT
// same handler array the browser worker uses (`src/mocks/handlers`). One
// contract, two runtimes. If a handler's shape drifts from the app's fetch,
// both the browser dev flow AND the test suite catch it.
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "@/mocks/handlers";

export const server = setupServer(...handlers);

beforeAll(() => {
  // "error" so an unhandled request in a test is a loud failure, not a
  // silent passthrough. Individual tests may relax this per-scope if needed.
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  // Isolate storage-driven state between tests (session.ts + AuthProvider).
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});

afterAll(() => {
  server.close();
});
