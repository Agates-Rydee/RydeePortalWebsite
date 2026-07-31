# Rydee Portal Website

React + TypeScript + Vite front-end for the Rydee rider/operator portal.

## Quick Start

```bash
npm i             # install dependencies
cp .env.example .env
npm run dev       # http://127.0.0.1:5173
```

## Project Structure

```
src/
├── assets/                    # static images (Logo.png, MapIcon.png)
├── components/                # cross-feature user-interface primitives
│   ├── shared.tsx             # Bg, Logo, cardStyle, btnPrimary, inputBase, FieldInput, Spinner
│   └── ui/                    # shadcn-derived primitives
├── features/                  # feature-scoped modules
│   ├── auth/
│   │   ├── AuthProvider.tsx   # React context: { profile, login, logout }
│   │   ├── ProtectedRoute.tsx # ProtectedRoute (allow=[Role]) + PublicOnly guards
│   │   └── pages/
│   │       ├── AuthShell.tsx  # shared visual chrome
│   │       ├── LoginPage.tsx  # POST /user/login
│   │       └── RegisterPage.tsx  # POST /register/user (+ /admin/register variant)
│   ├── dashboards/            # RiderDashboard, AdminDashboard, OperatorDashboard
│   └── riders/                # ActiveRiders, PendingRiders, RiderLocationView
├── lib/
│   └── config.ts              # API endpoint constants (environment-driven)
├── mocks/                     # mock service worker handlers (development only, tree-shaken from production)
│   ├── browser.ts             # setupWorker(...handlers)
│   └── handlers/
│       ├── index.ts
│       └── auth.ts            # POST /user/login, POST /register/user
├── styles/
│   └── index.css              # global styles + design tokens
├── types/
│   └── profile.ts             # Profile, ROLES=[Operator,Customer,Rider], roleHome()
├── main.tsx                   # entry: RouterProvider + conditional mock-worker boot
└── router.tsx                 # createBrowserRouter tree
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite development server (http://127.0.0.1:5173). Boots the mock service worker if `VITE_ENABLE_MSW=true`. |
| `npm run build` | Production build to `dist/`. Excludes the mock worker entirely. |
| `npm run lint` | ESLint over `src/`. |
| `npm run typecheck` | `tsc --noEmit` (project's current mode). |
| `npm run typecheck:strict` | `tsc --noEmit --strict` — must stay at 0 errors. |
| `npm run format` | Prettier over the repository. |

## Environment (`.env.example`)

| Variable | Purpose |
|---|---|
| `VITE_API_LOGIN_URL` | Login endpoint. Leave blank locally to fall back to `http://localhost:3000/user/login`. |
| `VITE_API_REGISTER_URL` | Register endpoint. Same defaulting. |
| `VITE_GOOGLE_MAPS_KEY` | Google Maps JavaScript key used by `RiderLocationView`. |
| `VITE_ENABLE_MSW` | `true` → the mock worker intercepts the two auth endpoints locally (development only). Set to anything else (or unset) to hit the real backend. |

Never commit a real `.env`. See `.gitignore`.

## Local Development — with or without a backend

**Without a backend (default for a solo frontend session)**

1. `.env` has `VITE_ENABLE_MSW=true`.
2. `npm run dev` — console shows the mock worker is enabled.
3. Log in with a seed user (login form takes **phone + password**):

   | Role | Phone | Password | Lands at |
   |---|---|---|---|
   | Rider | `0300111111` | `rider` | `/rider` |
   | Admin | `0300222222` | `admin` | `/admin` |
   | Operator | `0300333333` | `operator` | `/operator` |
   | Customer | `0300444444` | `customer` | back to `/login` (see note) |

   The Customer seed intentionally exercises the unknown-role logout
   path: Customer has no dashboard, so `PublicOnly` calls `logout()` and
   returns you to the login form. **Do not remove this seed** — it is the
   only in-app way to smoke-test that fix without hand-editing state.

   Full contract and seed details: [`src/mocks/README.md`](src/mocks/README.md).

**Against the real backend**

1. Start the backend (default expected on `http://localhost:3000`).
2. Set `VITE_ENABLE_MSW=false` (or delete the line) in `.env`.
3. `npm run dev`. Fetches now hit the real backend unchanged.
4. Optional: point at a different backend by setting `VITE_API_LOGIN_URL` / `VITE_API_REGISTER_URL`.

The mock worker never runs in `npm run build` — the dynamic import combined with
the `import.meta.env.DEV` guard causes Rollup to tree-shake the entire
`src/mocks/` tree out of the production bundle. Verified per build:
`rg msw dist/assets/*.js` → 0 hits.

## CI Notes

- Node 18+ recommended.
- Order for a fresh pull request: `npm ci && npm run lint && npm run typecheck && npm run typecheck:strict && npm run build`.
- Production bundle must not reference the mock worker — grep the output as an extra safeguard.
- Formatting is Prettier-enforced but not blocking; run `npm run format` before pushing.
