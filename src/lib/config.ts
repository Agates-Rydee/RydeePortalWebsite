// Env / API URL constants. Lifted verbatim from the old src/App.tsx
// (Checkpoint 5.1) so fetch contracts stay byte-compatible with what
// the backend team is building against.
export const API_LOGIN_URL =
  import.meta.env.VITE_API_LOGIN_URL ?? "http://localhost:3000/user/login";
export const API_REGISTER_URL =
  import.meta.env.VITE_API_REGISTER_URL ?? "http://localhost:3000/register/user";

// New endpoint introduced by origin/main 3f197d2 ("Removed mock from PendingRiders").
// Env var name preserved verbatim from the collaborator commit so shared .env
// files keep working. See ADR-0003 for request/response shape + MSW handler.
export const API_GET_UNREGISTERED_RIDERS_URL =
  import.meta.env.VITE_API_GET_All_UNREGISTERED_URL ??
  "http://localhost:3000/GetAll/UnregisteredRiders";

// ADR-0004: unified all-riders endpoint (proposed to backend).
// Additive — does NOT replace /GetAll/UnregisteredRiders (which is contractually
// the pending/unregistered subset). MSW handler is the living contract until
// the real backend ships. Env var name follows the sibling convention.
export const API_GET_ALL_RIDERS_URL =
  import.meta.env.VITE_API_GET_ALL_RIDERS_URL ??
  "http://localhost:3000/GetAll/Riders";
