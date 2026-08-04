import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { environmentValidation, EXPECTED_FORMATS, type EnvironmentProblem } from "./lib/env";
// Router is imported STATICALLY so the whole app graph lands in the same main chunk (bundle-size guard enforces a single gzip band on it). Consumers of env values must therefore tolerate an invalid environment at import time — the guard below is what stops them from running.
import { router } from "./router";
import "@/i18n";
import "./styles/index.css";

// Uses only raw DOM primitives — no router, no shadcn, no feature modules — so a broken environment never pulls the mocks tree or an app feature into a state where a stray env consumer would crash on import.
function renderEnvironmentErrorScreen(problems: EnvironmentProblem[]): void {
  const root = document.getElementById("root");
  if (!root) return;

  const describeProblem = (problem: EnvironmentProblem): string => {
    if (problem.kind === "missing") return "missing (not set in .env)";
    if (problem.kind === "empty") return "empty (value is blank)";
    return `invalid value ${JSON.stringify(problem.value)} — ${problem.reason}`;
  };

  const container = document.createElement("div");
  container.style.cssText = [
    "font-family: system-ui, -apple-system, Segoe UI, sans-serif",
    "max-width: 760px",
    "margin: 40px auto",
    "padding: 32px",
    "border: 1px solid #dc2626",
    "border-radius: 8px",
    "background: #fef2f2",
    "color: #111827",
    "line-height: 1.5",
  ].join(";");

  const title = document.createElement("h1");
  title.textContent = "Environment configuration error";
  title.style.cssText = "margin: 0 0 12px; font-size: 22px; color: #991b1b;";

  const lead = document.createElement("p");
  lead.textContent =
    "The application cannot start because one or more required environment variables are missing or misconfigured.";
  lead.style.cssText = "margin: 0 0 20px;";

  const problemsHeading = document.createElement("h2");
  problemsHeading.textContent = "Problems detected";
  problemsHeading.style.cssText = "margin: 20px 0 8px; font-size: 16px; color: #991b1b;";

  const problemsList = document.createElement("ul");
  problemsList.style.cssText = "margin: 0 0 20px; padding-left: 20px;";
  for (const problem of problems) {
    const item = document.createElement("li");
    const code = document.createElement("code");
    code.textContent = problem.name;
    code.style.cssText =
      "background: #fee2e2; padding: 1px 6px; border-radius: 4px; font-family: ui-monospace, monospace;";
    item.appendChild(code);
    item.appendChild(document.createTextNode(` — ${describeProblem(problem)}`));
    problemsList.appendChild(item);
  }

  const stepsHeading = document.createElement("h2");
  stepsHeading.textContent = "How to fix";
  stepsHeading.style.cssText = "margin: 20px 0 8px; font-size: 16px; color: #991b1b;";

  const stepsList = document.createElement("ol");
  stepsList.style.cssText = "margin: 0; padding-left: 20px;";

  const step1 = document.createElement("li");
  step1.innerHTML =
    'Copy <code style="background:#fee2e2;padding:1px 6px;border-radius:4px;font-family:ui-monospace,monospace">.env.example</code> to <code style="background:#fee2e2;padding:1px 6px;border-radius:4px;font-family:ui-monospace,monospace">.env</code> in the project root.';

  const step2 = document.createElement("li");
  step2.style.cssText = "margin-top: 8px;";
  step2.appendChild(document.createTextNode("Set each variable listed above. Expected formats:"));
  const formatsList = document.createElement("ul");
  formatsList.style.cssText = "margin: 6px 0 0; padding-left: 20px;";
  for (const problem of problems) {
    const formatItem = document.createElement("li");
    const formatCode = document.createElement("code");
    formatCode.textContent = problem.name;
    formatCode.style.cssText =
      "background: #fee2e2; padding: 1px 6px; border-radius: 4px; font-family: ui-monospace, monospace;";
    formatItem.appendChild(formatCode);
    formatItem.appendChild(
      document.createTextNode(` — ${EXPECTED_FORMATS[problem.name] ?? "see .env.example"}`),
    );
    formatsList.appendChild(formatItem);
  }
  step2.appendChild(formatsList);

  const step3 = document.createElement("li");
  step3.style.cssText = "margin-top: 8px;";
  step3.innerHTML =
    'Restart the development server with <code style="background:#fee2e2;padding:1px 6px;border-radius:4px;font-family:ui-monospace,monospace">npm run dev</code> — environment variables are only read at startup.';

  stepsList.append(step1, step2, step3);

  container.append(title, lead, problemsHeading, problemsList, stepsHeading, stepsList);

  root.innerHTML = "";
  root.appendChild(container);
}

// Dynamic import + DEV guard is the tree-shaking pattern that keeps the mocks tree out of the production bundle.
async function enableMockingIfConfigured(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_ENABLE_MSW !== "true") return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

// Environment is validated BEFORE the router or MSW boot — a failure renders the error screen and stops, so a stray consumer of env values can never execute against invalid input.
if (!environmentValidation.ok) {
  renderEnvironmentErrorScreen(environmentValidation.problems);
  console.error(
    "[env] Refusing to boot: environment variables missing or invalid",
    environmentValidation.problems,
  );
} else {
  void (async () => {
    await enableMockingIfConfigured();
    createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
  })();
}
