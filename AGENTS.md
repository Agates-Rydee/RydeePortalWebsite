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
│   └── riders/                 # ActiveRiders, PendingRiders, BlockedRiders, AllRiders
├── api/                        # API service wrapper + one file per backend domain
│   ├── client.ts               # get / post / put / delete, ApiError, base-URL join
│   ├── auth.ts                 # login, registerUser + API_LOGIN_URL, API_REGISTER_URL
│   └── riders.ts               # getUnregisteredRiders, getAllRiders + URL constants
├── lib/                        # helper libraries (env validator, env rules)
├── mocks/                      # MSW handlers — dev-only, tree-shaken from prod
│   └── handlers/<domain>.ts
├── types/                      # Profile, ROLES, roleHome
├── styles/index.css
├── main.tsx                    # RouterProvider + conditional MSW boot
└── router.tsx                  # createBrowserRouter tree per ADR-0002
```

## Commands & gates

| Command                    | Purpose                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`              | Vite dev server; boots MSW iff `VITE_ENABLE_MSW=true`                              |
| `npm run build`            | Prod build to `dist/`; MSW absent (verify with `rg msw dist/assets/*.js` → 0 hits) |
| `npm run lint`             | ESLint over `src/`                                                                 |
| `npm run typecheck`        | `tsc --noEmit`                                                                     |
| `npm run typecheck:strict` | `tsc --noEmit --strict` — must stay at 0 errors                                    |
| `npm run format`           | Prettier                                                                           |
| `npm test`                 | Vitest run — jsdom + RTL + msw/node (reuses `src/mocks/handlers`)                  |
| `npm run test:watch`       | Vitest watch mode                                                                  |

**All five gates (lint, typecheck, typecheck:strict, build, test) must be green before every commit.** CI mirrors them.

## Hard rules

Break any of these and QA blocks the PR.

- **H1. API contract to the WIP backend is FROZEN**: `POST /user-login` body `{ phone, password }`; `POST /register-user` body `{ name, email?, phone, dob, address, password, role }` (email optional as of v3, 2026-08-04) (backend renamed `phoneNumber` → `phone` on 2026-07-30; resource paths kebab-cased to match `docs/design/API-Document.pdf` on 2026-08-04 — see ADR-0003 v2 amendment). Rider list endpoints `POST /get-all-inactive-riders` and `POST /get-all-riders` return `{ riders: [{ role, profile: {...} }] }`; the api-client flattens `.profile` before pages see it. All calls include `credentials: 'include'`. Do **not** alter fetch shapes without a new ADR.
- **H2. Never widen `ROLES`.** It is `["Operator", "Customer", "Rider"]` (see `src/types/profile.ts`). **Never add `Admin` as a creatable role via `/admin/register`** — QA F2 security incident. Product Q tracked as D14.
- **H3. Never delete the Customer seed user** (`src/mocks/handlers/auth.ts`, phone `0300444444`). It is the QA-F1 regression tripwire: it exercises `PublicOnly`'s unknown-role logout path (`roleHome("Customer") === "/login"` → `logout()` in `useEffect`).
- **H4. Do not edit `src/components/ui/**`** — generated shadcn primitives, lint-ignored, replace via CLI or full-file rewrite in a scoped commit.
- **H5. Never commit `.env`.** `.gitignore` covers it; if you touch it, verify with `git status`.
- **H6. Endpoint paths and composed URL constants live in `src/api/<feature>.ts` alongside the fetch call sites; MSW handlers must import those URL constants from the same feature module (never re-declare or hard-code them).** Features must never call `fetch` directly — all backend traffic goes through the `src/api/client.ts` wrapper. Response/request shapes must match ADR-0003's contract table (the living contract). Update the ADR in the same commit as any shape change.
- **H7. Auth/session changes go through `src/features/auth/session.ts` helpers** (`loadSession`, `saveSession`, `clearSession`). Envelope is versioned (`{ v: 1, profile, savedAt }`); adding token fields = bump to v2 + additive shape change. Never read/write `localStorage` for auth from anywhere else.
- **H8. `roleHome()` / guard changes require tracing `PublicOnly` + `ProtectedRoute` for unknown roles.** No redirect loops. Reference the F1 trace in `local-docs/qa/c5-review.md` before shipping.
- **H9. No unnecessary comments.** Code carries comments ONLY where non-obvious logic needs explaining, written in plain English without abbreviations. No banner headers, no history/migration notes, no comments restating the code, no section dividers, no parameter-repeating JSDoc. Comments required by tooling (`eslint-disable`, `@ts-*`) are exempt. QA blocks any diff that adds them.
- **H10. Keep the code as simple as possible.** Do not over-engineer: no abstractions, indirection, generics, or configurability beyond what the current requirement needs, and no unnecessary code another developer would struggle to follow. Prefer the boring, obvious implementation. Export only what consumers actually use. QA blocks diffs that add speculative complexity.

## Architecture conventions

- **New feature code** → `src/features/<domain>/` with local `pages/`, `components/`, and colocated types.
- **Shared types** → `src/types/` (never re-declare `Profile` inline; see D6).
- **Endpoint constants** → `src/api/<feature>.ts` alongside the API helper (never hard-code URLs, never re-add `src/lib/config.ts`).
- **New mock handlers** → `src/mocks/handlers/<domain>.ts`, exported as `<domain>Handlers`, registered in `handlers/index.ts`. Sync ADR-0003.
- **`@/` alias** = `src/` (see `tsconfig.json`, `vite.config.ts`).
- **Significant decisions** → new ADR under `local-docs/adr/NNNN-slug.md` (next free number). Update ADR status when merging.
- **Known debt / TODOs** → `local-docs/design/migration-plan.md` §"Deferred Work Register" (D1…D17). Add a new row before adding a TODO comment in code.

## Commit style

- Conventional commits: `feat(scope): …`, `fix(scope): …`, `docs: …`, `refactor(scope): …`, `chore(scope): …`.
- Small, reviewable commits. Every commit ends with all four gates green.
- Body: what + why + gate results + any deferred-register updates.

## Before you start

1. **Read `local-docs/PROJECT.md`** — current state, active priorities, open items.
2. **Read the Deferred Work Register** in `local-docs/design/migration-plan.md` — check whether the thing you're about to build is already tracked (or intentionally deferred).
3. **After significant work**, update `local-docs/PROJECT.md` open-items list.

## Pointers

- Routing + guards: [`local-docs/adr/0002-routing-and-auth.md`](local-docs/adr/0002-routing-and-auth.md)
- Mock API contract: [`local-docs/adr/0003-mock-api-msw.md`](local-docs/adr/0003-mock-api-msw.md)
- Folder structure rationale: [`local-docs/adr/0001-target-folder-structure.md`](local-docs/adr/0001-target-folder-structure.md)
- Mock developer guide: [`src/mocks/README.md`](src/mocks/README.md)
- QA findings history: [`local-docs/qa/`](local-docs/qa/)
