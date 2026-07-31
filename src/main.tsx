import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./router";
import "./styles/index.css";

// Mock service worker boot: dev only, gated on VITE_ENABLE_MSW. The dynamic import combined with the import.meta.env.DEV guard lets the bundler tree-shake the entire mocks tree out of production.
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
