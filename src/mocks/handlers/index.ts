// Aggregate handlers per backend domain. Sync ADR-0003 whenever a
// domain/handler is added or a shape changes (H6).
import { authHandlers } from "./auth";
import { ridersHandlers } from "./riders";

export const handlers = [...authHandlers, ...ridersHandlers];
