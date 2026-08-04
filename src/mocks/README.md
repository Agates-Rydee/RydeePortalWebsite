# Auth Mocks (MSW 2.x)

Developer guide for the MSW handlers under this directory. Living contract
is [ADR-0003](../../docs/adr/0003-mock-api-msw.md); this file is the
practical how-to.

## What MSW does here

- Intercepts real `fetch()` calls at the network layer using a service worker
  (`public/mockServiceWorker.js`).
- Returns canned responses for the auth endpoints defined in
  [`handlers/auth.ts`](./handlers/auth.ts), so the frontend runs fully
  offline against a WIP backend.
- Active **only when**:
  - `import.meta.env.DEV === true` (i.e. you ran `npm run dev`, not `build`), and
  - `VITE_ENABLE_MSW === "true"` in your `.env`.

  Both checks live in [`src/main.tsx`](../main.tsx). The `import()` of
  `./mocks/browser` is dynamic and behind the `DEV` guard, so **Rollup
  tree-shakes this entire directory out of production bundles.** Verified
  per build: `rg "msw|setupWorker|mockServiceWorker" dist/assets/*.js` → 0
  hits.

## Quick start

```bash
cp .env.example .env
# .env already has VITE_ENABLE_MSW=true
npm run dev
```

You need **no backend running**. Watch the browser console for
`[MSW] Mocking enabled.`.

## Seed users

The login form takes **phone + password** (9\u201311 digit phone, per the
client-side `/^\d{9,11}$/` check in `LoginPage.tsx`).

| Role | Phone | Password | What you'll see |
|---|---|---|---|
| Rider | `0300111111` | `rider` | Lands on `/rider` (RiderDashboard) |
| Admin | `0300222222` | `admin` | Lands on `/admin` (Dashboard) |
| Operator | `0300333333` | `operator` | Lands on `/operator` (Dashboard) |
| Customer | `0300444444` | `customer` | Bounces back to `/login` (see below) |

### About the Customer seed

Customer has no dashboard (`roleHome("Customer")` returns `/login`).
Logging in as Customer therefore triggers the QA-F1 fix path:

1. `LoginPage.handleSubmit` → `auth.login(profile)` + `navigate("/login")`.
2. `PublicOnly` sees the authed profile and computes `home = "/login"`
   (unknown role).
3. `useEffect` fires `logout()` → next render clears the session.
4. `<Outlet/>` renders `LoginPage` again — session is clean.

**Do not delete this seed.** It is the only in-app way to smoke-test the
F1 unknown-role logout without hand-editing React state. If Customer ever
gains a dashboard, update `roleHome()` in `src/types/profile.ts` and this
seed's expected outcome above.

## Session persistence

Since D9 (2026-07-29), `AuthProvider` persists the profile in
`localStorage` under the key `rydee.session` using a versioned envelope
`{ v: 1, profile, savedAt }`. See
[`src/features/auth/session.ts`](../features/auth/session.ts) for the
read/write helpers. Consequences for local mock-based dev:

- Refreshing on `/rider`/`/admin`/`/operator` **stays** on that page
  (no round-trip to `/login`).
- Session survives tab close and browser restart (localStorage
  semantics). To force a logged-out state without clicking logout:
  DevTools → Application → Local Storage → delete `rydee.session` →
  refresh.
- Logging in as Customer, refreshing → the stored envelope is
  rehydrated, `PublicOnly` detects the unknown role, and `logout()`
  clears the key. Loop stays broken.
- Client-side TTL: envelopes older than 24h (`SESSION_MAX_AGE_MS`) are
  discarded on rehydrate → user lands on `/login`. This is a stopgap
  approximation of real token expiry until backend tokens land (D17).
- Unknown envelope version (e.g. a future v2 payload seen by v1 code)
  is treated as logged out and cleared.

Server-side revocation (`/me`) and real token-based auth are still
deferred (D9-remainder + D17 in
[`docs/design/migration-plan.md`](../../docs/design/migration-plan.md)).

## Mocked endpoint contract

URLs come from the per-feature modules under [`src/api/`](../api/) —
`src/api/auth.ts` for the auth endpoints and `src/api/riders.ts` for the
rider endpoints. The mock handlers import the same URL constants the
pages use, so endpoint drift is impossible.

| Method + URL | Request body | Success (200) | Failure |
|---|---|---|---|
| `POST` `API_LOGIN_URL` | `{ phone: string, password: string }` | `{ role: string, profile: Profile }` | `401` text `"Invalid phone or password"` |
| `POST` `API_REGISTER_URL` | `{ name, email, phone, dob, address, password, role }` | `{ ok: true, email, role }` | `400` text `"Missing required fields"` |

All requests include `credentials: "include"` (cookie flow ready for the
real backend). Handlers currently ignore cookies; add if backend introduces
session cookies MSW must simulate.

## Adding a new handler

1. Create `src/mocks/handlers/<domain>.ts` — one file per backend domain
   (`auth`, `riders`, …). Export a `<domain>Handlers` array.
2. Build URLs from `src/api/<feature>.ts` constants. Add the endpoint
   path + composed URL constant there if it doesn't exist; do **not**
   hard-code URLs in handler files.
3. Register the array in [`handlers/index.ts`](./handlers/index.ts):
   ```ts
   import { ridersHandlers } from "./riders";
   export const handlers = [...authHandlers, ...ridersHandlers];
   ```
4. Update the contract table in
   [ADR-0003](../../docs/adr/0003-mock-api-msw.md) — the ADR is the
   living contract and must not drift from the code.
5. If your handler introduces new response shapes, mirror them in
   [`src/types/`](../types/) so the app + tests share types.

## Troubleshooting

**Login returns 401 with credentials I know are correct**

- Phone must be **9\u201311 digits**. `LoginPage` blocks submit
  otherwise; if a client bypasses that check, handlers still 401 on
  mismatch. Check the seed table above.
- Password is case-sensitive.

**Console never shows `[MSW] Mocking enabled.`**

- `VITE_ENABLE_MSW` must be the literal string `"true"` (env vars are
  strings). `.env.example` sets it correctly; make sure your `.env`
  mirrors it.
- Confirm `public/mockServiceWorker.js` exists. If not, run
  `npx msw init public/ --save`.
- Check DevTools → Application → Service Workers for a registered
  worker at scope `/`. Unregister and reload if state is stale.

**I want to hit the real backend**

Set `VITE_ENABLE_MSW=false` in `.env`. Fetches now pass through to
`VITE_API_BASE_URL` (the endpoint paths are hard-coded in
`src/api/<feature>.ts` alongside the fetch call sites) — no code change.

If the real backend has broken CORS, set `VITE_API_BASE_URL=` (empty) and
`VITE_DEV_PROXY_TARGET=<upstream-url>` instead. The Vite dev server then
proxies `/user`, `/register` and `/GetAll` to that target with
`changeOrigin` + cookie-domain rewrite to `localhost`, keeping the browser
same-origin. Only active in `npm run dev`; production builds are unaffected.
See `.env.example` mode (b).

**A non-auth request errors "Uncaught in fetch"**

Handlers use `onUnhandledRequest: "bypass"`, so map tiles, Google Maps,
fonts, etc. flow through. If you see a bypass-caused CORS error, the
real network request is failing (not MSW-related).

## References

- [ADR-0003 — Mock API via MSW 2.x](../../docs/adr/0003-mock-api-msw.md) — living contract
- [ADR-0002 — Routing & Auth](../../docs/adr/0002-routing-and-auth.md) — role → route table
- [MSW docs](https://mswjs.io/docs/) — official 2.x reference
