import { authHandlers } from "./auth";
import { ridersHandlers } from "./riders";
import { riderDocumentsHandlers } from "./riderDocuments";
import { ridesHandlers } from "./rides";

export const handlers = [
  ...authHandlers,
  ...ridersHandlers,
  ...riderDocumentsHandlers,
  ...ridesHandlers,
];
