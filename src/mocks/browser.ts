// MSW service-worker setup for dev. Loaded ONLY via dynamic import from
// src/main.tsx when import.meta.env.DEV && VITE_ENABLE_MSW==="true".
// Dynamic import + DEV guard keeps this module out of prod bundles.
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
