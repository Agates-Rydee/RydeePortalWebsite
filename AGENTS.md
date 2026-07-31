# AGENTS.md

Canonical rules for AI coding assistants (Claude Code, Cursor, Copilot,
Aki, etc.) working on this repo. Human contributors: same rules apply.

## Project snapshot

- **Stack**: React 18.3.1 + TypeScript + Vite; react-router v7 (library mode); Tailwind CSS; MSW 2.x (dev only).
- **Three roles**: Rider, Admin, Operator. (`Customer` exists as a role literal but has no dashboard — see hard rule H3.)
- **Layout** (feature-based, per ADR-0001):

```
src/
├── assets/                     # static images
├── components/                 # cross-feature UI (shared.tsx, ui/ = shadcn)
├── features/
│   ├── auth/                   # AuthProvider, ProtectedRoute, PublicOnly, session.ts
│   │   └── pages/              # LoginPage, RegisterPage, AuthShell
│   ├── dashboards/             # RiderDashboard, AdminDashboard, OperatorDashboard
│   └── riders/                 # ActiveRiders, PendingRiders, RiderLocationView
├── lib/config.ts               # API_LOGIN_URL, API_REGISTER_URL — single source of endpoint truth
├── mocks/                      # MSW handlers — dev-only, tree-shaken from prod
│   └── handlers/<domain>.ts
├── types/                      # Profile, ROLES, roleHome
├── styles/index.css
├── main.tsx                    # RouterProvider + conditional MSW boot
└── router.tsx                  # createBrowserRouter tree per ADR-0002
```

## Commands & gates

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server; boots MSW iff `VITE_ENABLE_MSW=true` |
| `npm run build` | Prod build to `dist/`; MSW absent (verify with `rg msw dist/assets/*.js` → 0 hits) |
| `npm run lint` | ESLint over `src/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run typecheck:strict` | `tsc --noEmit --strict` — must stay at 0 errors |
| `npm run format` | Prettier |
| `npm test` | Vitest run — jsdom + RTL + msw/node (reuses `src/mocks/handlers`) |
| `npm run test:watch` | Vitest watch mode |

**All five gates (lint, typecheck, typecheck:strict, build, test) must be green before every commit.** CI mirrors them.

## Hard rules

Break any of these and QA blocks the PR.

- **H1. API contract to the WIP backend is FROZEN**: `POST /user/login` body `{ phone, password }`; `POST /register/user` body `{ name, email, phone, dob, address, password, role }` (backend renamed `phoneNumber` → `phone` on 2026-07-30 — see ADR-0003). All calls include `credentials: 'include'`. Do **not** alter fetch shapes without a new ADR.
- **H2. Never widen `ROLES`.** It is `["Operator", "Customer", "Rider"]` (see `src/types/profile.ts`). **Never add `Admin` as a creatable role via `/admin/register`** — QA F2 security incident. Product Q tracked as D14.
- **H3. Never delete the Customer seed user** (`src/mocks/handlers/auth.ts`, phone `0300444444`). It is the QA-F1 regression tripwire: it exercises `PublicOnly`'s unknown-role logout path (`roleHome("Customer") === "/login"` → `logout()` in `useEffect`).
- **H4. Do not edit `src/components/ui/**`** — generated shadcn primitives, lint-ignored, replace via CLI or full-file rewrite in a scoped commit.
- **H5. Never commit `.env`.** `.gitignore` covers it; if you touch it, verify with `git status`.
- **H6. MSW handlers must import endpoint URLs from `src/lib/config.ts`.** Response/request shapes must match ADR-0003's contract table (the living contract). Update the ADR in the same commit as any shape change.
- **H7. Auth/session changes go through `src/features/auth/session.ts` helpers** (`loadSession`, `saveSession`, `clearSession`). Envelope is versioned (`{ v: 1, profile, savedAt }`); adding token fields = bump to v2 + additive shape change. Never read/write `localStorage` for auth from anywhere else.
- **H8. `roleHome()` / guard changes require tracing `PublicOnly` + `ProtectedRoute` for unknown roles.** No redirect loops. Reference the F1 trace in `docs/qa/c5-review.md` before shipping.

## Architecture conventions

- **New feature code** → `src/features/<domain>/` with local `pages/`, `components/`, and colocated types.
- **Shared types** → `src/types/` (never re-declare `Profile` inline; see D6).
- **Endpoint constants** → `src/lib/config.ts` (never hard-code URLs).
- **New mock handlers** → `src/mocks/handlers/<domain>.ts`, exported as `<domain>Handlers`, registered in `handlers/index.ts`. Sync ADR-0003.
- **`@/` alias** = `src/` (see `tsconfig.json`, `vite.config.ts`).
- **Significant decisions** → new ADR under `docs/adr/NNNN-slug.md` (next free number). Update ADR status when merging.
- **Known debt / TODOs** → `docs/design/migration-plan.md` §"Deferred Work Register" (D1…D17). Add a new row before adding a TODO comment in code.

## Commit style

- Conventional commits: `feat(scope): …`, `fix(scope): …`, `docs: …`, `refactor(scope): …`, `chore(scope): …`.
- Small, reviewable commits. Every commit ends with all four gates green.
- Body: what + why + gate results + any deferred-register updates.

## Before you start

1. **Read `docs/PROJECT.md`** — current state, active priorities, open items.
2. **Read the Deferred Work Register** in `docs/design/migration-plan.md` — check whether the thing you're about to build is already tracked (or intentionally deferred).
3. **After significant work**, update `docs/PROJECT.md` open-items list.

## Pointers

- Routing + guards: [`docs/adr/0002-routing-and-auth.md`](docs/adr/0002-routing-and-auth.md)
- Mock API contract: [`docs/adr/0003-mock-api-msw.md`](docs/adr/0003-mock-api-msw.md)
- Folder structure rationale: [`docs/adr/0001-target-folder-structure.md`](docs/adr/0001-target-folder-structure.md)
- Mock developer guide: [`src/mocks/README.md`](src/mocks/README.md)
- QA findings history: [`docs/qa/`](docs/qa/)
