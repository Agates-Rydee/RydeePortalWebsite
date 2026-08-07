import { authHandlers } from "./auth";
import { ridersHandlers } from "./riders";
import { riderDocumentsHandlers } from "./riderDocuments";

export const handlers = [...authHandlers, ...ridersHandlers, ...riderDocumentsHandlers];
