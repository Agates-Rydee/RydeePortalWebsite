import { defineConfig, devices } from "@playwright/test";

// Frugal E2E smoke: chromium only, one worker, one retry. Not part of the
// default 5 gates — invoked manually via `npm run test:e2e`. Rationale
// documented in docs/qa/iter4-review.md §"Iteration 4.2 addendum".
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // Boot dev with MSW so the frozen contract (H1) is honored and no
    // network egress happens during the smoke.
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { VITE_ENABLE_MSW: "true" },
    stdout: "ignore",
    stderr: "pipe",
  },
});
