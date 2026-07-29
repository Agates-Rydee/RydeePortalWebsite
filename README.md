# Rydee Portal Website

React + TypeScript + Vite front-end for the Rydee rider/operator portal.

Originally scaffolded from Figma Make (KynuhPLPFKgVwfCNqF6y7O). The
codebase was restructured over Checkpoints 0–7 (see `docs/design/migration-plan.md`
and `docs/adr/`) into the feature-based layout described below.

## Quick Start

```bash
npm i             # install dependencies
cp .env.example .env
npm run dev       # http://127.0.0.1:5173
```

## Project Structure (per ADR-0001)

```
src/
├── assets/                    # static images (Logo.png, MapIcon.png)
├── components/                # cross-feature UI primitives
│   ├── shared.tsx             # Bg, Logo, cardStyle, btnPrimary, inputBase, FieldInput, Spinner
│   └── ui/                    # shadcn-derived primitives (deferred adoption — D8)
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
│   └── config.ts              # API_LOGIN_URL, API_REGISTER_URL (env-driven)
├── mocks/                     # MSW handlers (dev-only, tree-shaken from prod)
│   ├── browser.ts             # setupWorker(...handlers)
│   └── handlers/
│       ├── index.ts
│       └── auth.ts            # POST /user/login, POST /register/user
├── styles/
│   └── index.css              # global styles + design tokens
├── types/
│   └── profile.ts             # Profile, ROLES=[Operator,Customer,Rider], roleHome()
├── main.tsx                   # entry: RouterProvider + conditional MSW boot
└── router.tsx                 # createBrowserRouter tree per ADR-0002
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (http://127.0.0.1:5173). Boots MSW iff `VITE_ENABLE_MSW=true`. |
| `npm run build` | Production build to `dist/`. Excludes MSW entirely. |
| `npm run lint` | ESLint over `src/`. |
| `npm run typecheck` | `tsc --noEmit` (project's current mode). |
| `npm run typecheck:strict` | `tsc --noEmit --strict` — must stay at 0 errors. |
| `npm run format` | Prettier over the repo. |

## Environment (`.env.example`)

| Variable | Purpose |
|---|---|
| `VITE_API_LOGIN_URL` | Login endpoint. Leave blank locally to fall back to `http://localhost:3000/user/login`. |
| `VITE_API_REGISTER_URL` | Register endpoint. Same defaulting. |
| `VITE_GOOGLE_MAPS_KEY` | Google Maps JS key used by `RiderLocationView`. |
| `VITE_ENABLE_MSW` | `true` → MSW intercepts the two auth endpoints locally (dev-only). Set to anything else (or unset) to hit the real backend. |

Never commit a real `.env`. See `.gitignore`.

## Local Dev — with vs. without a backend

**Without a backend (default for a solo frontend session)**

1. `.env` has `VITE_ENABLE_MSW=true`.
2. `npm run dev` — console shows `[MSW] Mocking enabled`.
3. Log in with a seed user (login form takes **phone + password**):

   | Role | Phone | Password | Lands at |
   |---|---|---|---|
   | Rider | `0300111111` | `rider` | `/rider` |
   | Admin | `0300222222` | `admin` | `/admin` |
   | Operator | `0300333333` | `operator` | `/operator` |
   | Customer | `0300444444` | `customer` | back to `/login` (see note) |

   The Customer seed intentionally exercises the F1 unknown-role logout
   path: Customer has no dashboard, so `PublicOnly` calls `logout()` and
   returns you to the login form. **Do not remove this seed** — it's the
   only in-app way to smoke-test the F1 fix without hand-editing state.

   Full contract + seed details: [`src/mocks/README.md`](src/mocks/README.md).

**Against the real backend**

1. Start the backend (default expected on `http://localhost:3000`).
2. Set `VITE_ENABLE_MSW=false` (or delete the line) in `.env`.
3. `npm run dev`. Fetches now hit the real backend unchanged.
4. Optional: point at a different backend by setting `VITE_API_LOGIN_URL` / `VITE_API_REGISTER_URL`.

MSW never runs in `npm run build` — the dynamic `import("./mocks/browser")`
plus the `import.meta.env.DEV` guard cause Rollup to tree-shake the entire
`src/mocks/` tree out of the production bundle. Verified per build:
`rg msw dist/assets/*.js` → 0 hits.

## Routing (per ADR-0002)

| Path | Component | Guard |
|---|---|---|
| `/login`, `/register` | `LoginPage`, `RegisterPage` | `PublicOnly` |
| `/rider` | `RiderDashboard` | Rider |
| `/admin`, `/admin/register` | `AdminDashboard`, `RegisterPage` | Admin |
| `/admin/active-riders`, `/admin/pending-riders`, `/admin/riders/:riderId/location` | rider-management views | Admin **or** Operator |
| `/operator` | `OperatorDashboard` | Operator |
| `/` | index redirect → role home or `/login` | — |
| `*` | catch-all → `/` | — |

`PublicOnly` detects the edge case where `roleHome()` returns `/login`
(unknown / `Customer` / empty role) and calls `logout()` from a
`useEffect` to break the potential redirect loop.

## CI Notes

- Node 18+ recommended.
- Order for a fresh PR: `npm ci && npm run lint && npm run typecheck && npm run typecheck:strict && npm run build`.
- Prod bundle must not reference MSW — grep the output as an extra safeguard.
- Formatting is Prettier-enforced but not blocking; run `npm run format` before pushing.

## ADRs

- [ADR-0001 — Target Folder Structure (Feature-Based)](docs/adr/0001-target-folder-structure.md) — Accepted
- [ADR-0002 — Routing & Auth](docs/adr/0002-routing-and-auth.md) — Accepted (amended for QA F3)
- [ADR-0003 — Mock API via MSW 2.x](docs/adr/0003-mock-api-msw.md) — Accepted

## Deferred Work

See §D in `docs/design/migration-plan.md` — currently D1–D16 (strict-mode
unification for `RiderDashboard`, session persistence, product Qs surfaced
by QA, etc.). Nothing on that list blocks day-to-day development.
