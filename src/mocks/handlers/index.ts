// Aggregate handlers per backend domain (auth today; riders later).
import { authHandlers } from "./auth";

export const handlers = [...authHandlers];
