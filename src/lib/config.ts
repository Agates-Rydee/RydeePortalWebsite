// Env / API URL constants. Lifted verbatim from the old src/App.tsx
// (Checkpoint 5.1) so fetch contracts stay byte-compatible with what
// the backend team is building against.
export const API_LOGIN_URL =
  import.meta.env.VITE_API_LOGIN_URL ?? "http://localhost:3000/user/login";
export const API_REGISTER_URL =
  import.meta.env.VITE_API_REGISTER_URL ?? "http://localhost:3000/register/user";
