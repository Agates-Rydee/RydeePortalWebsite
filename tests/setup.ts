// Boot an msw/node server against the same handler array the browser worker
// uses so a handler-shape drift is caught by both the dev flow and the test
// suite from a single source of truth.
import "@testing-library/jest-dom/vitest";
import "@/i18n";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "@/mocks/handlers";

export const server = setupServer(...handlers);

beforeAll(() => {
  // onUnhandledRequest is set to "error" so a request without a matching
  // handler fails the test loudly rather than silently passing through.
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  // Clear localStorage so state persisted by the session helpers does not
  // leak between tests.
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});

afterAll(() => {
  server.close();
});
