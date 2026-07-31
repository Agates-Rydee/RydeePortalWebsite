export const API_LOGIN_URL =
  import.meta.env.VITE_API_LOGIN_URL ?? "http://localhost:3000/user/login";
export const API_REGISTER_URL =
  import.meta.env.VITE_API_REGISTER_URL ?? "http://localhost:3000/register/user";

// The environment-variable name is preserved verbatim so shared .env files
// from earlier deployments continue to resolve.
export const API_GET_UNREGISTERED_RIDERS_URL =
  import.meta.env.VITE_API_GET_All_UNREGISTERED_URL ??
  "http://localhost:3000/GetAll/UnregisteredRiders";

// This is additive and does not replace the unregistered-riders endpoint,
// which continues to serve the pending-only subset by contract.
export const API_GET_ALL_RIDERS_URL =
  import.meta.env.VITE_API_GET_ALL_RIDERS_URL ??
  "http://localhost:3000/GetAll/Riders";
