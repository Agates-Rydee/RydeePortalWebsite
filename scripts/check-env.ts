// Runs as `npm run prebuild` so a production build only starts after the required environment variables have been validated. On failure the script exits non-zero, which aborts `npm run build` before Vite bundles.

import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadEnv } from "vite";

import {
  validateEnvironment,
  EXPECTED_FORMATS,
  type EnvironmentProblem,
} from "../src/lib/env-rules.ts";

// CHECK_ENV_PROJECT_ROOT lets the regression test point the gate at a temporary directory with a controlled .env; it is never set by the real build pipeline.
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot =
  process.env.CHECK_ENV_PROJECT_ROOT ?? path.resolve(scriptDirectory, "..");

// Passing "" as the prefix returns every variable (not just VITE_*) so the validator can see them all. Mode "production" matches what `vite build` uses so the .env resolution order matches the real build.
const viteEnvironment = loadEnv("production", projectRoot, "");

const validation = validateEnvironment(viteEnvironment);

if (validation.ok) {
  process.exit(0);
}

function describeProblem(problem: EnvironmentProblem): string {
  if (problem.kind === "missing") return "missing (not set in .env)";
  if (problem.kind === "empty") return "empty (value is blank)";
  return `invalid value ${JSON.stringify(problem.value)} — ${problem.reason}`;
}

console.error("");
console.error(
  "Environment configuration error — refusing to build a broken artifact.",
);
console.error("");
console.error("Problems detected:");
for (const problem of validation.problems) {
  console.error(`  - ${problem.name}: ${describeProblem(problem)}`);
}
console.error("");
console.error("How to fix:");
console.error(
  "  1. Copy .env.example to .env in the project root.",
);
console.error(
  "  2. Set each variable listed above. Expected formats:",
);
for (const problem of validation.problems) {
  const expected = EXPECTED_FORMATS[problem.name] ?? "see .env.example";
  console.error(`     - ${problem.name}: ${expected}`);
}
console.error(
  "  3. Rerun `npm run build` — environment variables are only read at startup.",
);
console.error("");

process.exit(1);
