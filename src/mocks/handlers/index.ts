import { authHandlers } from "./auth";
import { ridersHandlers } from "./riders";

export const handlers = [...authHandlers, ...ridersHandlers];
