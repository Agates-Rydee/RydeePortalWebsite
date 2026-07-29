import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./router";
import "./styles/index.css";

// MSW boot — dev only, and only when explicitly enabled via VITE_ENABLE_MSW.
// The dynamic import() + `import.meta.env.DEV` guard causes Vite/Rollup to
// tree-shake the entire mocks/ subtree out of the production bundle. See
// ADR-0003.
async function enableMockingIfConfigured(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_ENABLE_MSW !== "true") return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

void enableMockingIfConfigured().then(() => {
  createRoot(document.getElementById("root")!).render(
    <RouterProvider router={router} />,
  );
});
