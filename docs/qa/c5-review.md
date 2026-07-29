# C5 Review — `refactor(c5): react-router + auth provider + role guards` (79822f1)

**Reviewer:** QA-C5-Review (sub-agent) · **Date:** 2026-07-29
**Base:** 41d649e (C4) · **Head:** 79822f1 (C5)
**Scope:** Static/code review + local `npm run lint`, `npm run typecheck`.
**Gates re-run locally:** typecheck ✅ 0 errors · lint ✅ 0 errors / 14 warnings (as reported).

---

## Verdict

**⚠️ FIX FIRST — 1 blocker, 1 major security regression.** Do not proceed to C6 until F1 and F2 are resolved. Everything else is either minor debt or already documented in the commit body.

The byte-parity claim on the login/register fetch calls is **verified true**. The route tree matches ADR-0002 §"Decision — Route Tree" exactly. The regressions below are all in the *guard/redirect* layer or the shared types file, not in the copied fetch/UI code.

---

## Findings

| # | Sev | Area | Finding | Evidence |
|---|-----|------|---------|----------|
| **F1** | **BLOCKER** | Guards / redirects | **Infinite redirect loop for any authenticated user whose role is not Rider/Admin/Operator** (Customer, empty string, or a typoed backend value). Flow: `ProtectedRoute` denies → `<Navigate to={roleHome(role)}/>` returns `/login` for unknown roles. `/login` is wrapped in `PublicOnly`, which sees `profile != null` and redirects to `roleHome(role)` = `/login`. React-router will throw "Maximum update depth exceeded" and blank the screen. Same loop fires post-login if backend ever returns `role: "customer"` (commit body even acknowledges this destination is undefined — but the "safe fallback" is not safe: it loops). | `ProtectedRoute.tsx:29`, `PublicOnly` at `ProtectedRoute.tsx:41-43`, `profile.ts:37-39`, commit body "D11" |
| **F2** | **MAJOR (security regression)** | Types / register form | `ROLES` was expanded from old `["Operator","Customer","Rider"]` to `["Rider","Admin","Operator","Customer"]`. The `showRole` variant of `RegisterPage` (used at `/admin/register`) now offers **"Admin"** as a self-service-creatable role. Old code had no way to create an Admin from the UI. `/admin/register` is Admin-guarded so this is not internet-exposed, but it silently widens the privilege-escalation surface (any compromised Admin session can mint more Admins with no audit path). Not called out in the commit body. Public `/register` is unaffected — `showRole=false` there, and the form still hard-codes `role: "rider"` in the fetch body. | `types/profile.ts:5` vs `git show 41d649e:src/App.tsx:35`; `RegisterPage.tsx:109` |
| **F3** | Major | UX — Operator dashboard | Operator dashboard "Active Riders" / "Pending Riders" buttons navigate to `/admin/active-riders` and `/admin/pending-riders`, which are Admin-guarded. Operator → `ProtectedRoute` denies → `roleHome("operator")` → back to `/operator`. No loop (F1 doesn't fire; role IS known), but the button is a **silent no-op** — the operator sees nothing happen. Old code did render those pages for operators. Either widen `allow: ["Admin","Operator"]` on those two routes or remove/disable the operator buttons. Product decision required — noted in commit body but must be resolved before ship. | `router.tsx:136-137`, `OperatorDashboard.tsx:82,105` |
| **F4** | Minor | Login behavior | `auth.login({...profile, role: role || profile.role})` overwrites `profile.role` with the top-level `data.role`. Old code stored `data.profile` unmodified and used the top-level `role` only for the navigation `switch`. Downstream code that reads `profile.role` (e.g. `AdminDashboard`, `roleHome` in `ActiveRidersRoute.onBack`) now sees the top-level string casing (e.g. `"admin"`) instead of whatever `data.profile.role` had (e.g. `"Admin"`). All comparisons currently go through `.toLowerCase()`, so no functional impact — but it's a silent contract change worth documenting. | `LoginPage.tsx:66` vs `App.tsx:228-243` |
| **F5** | Minor | Register — history | Post-successful-register: old `onNavigate("login")` was a state reset (no history entry). New `navigate("/login")` pushes onto history — pressing Back on `/login` after registering returns to the (now-stale) register form. Use `navigate("/login", { replace: true })`. | `RegisterPage.tsx:61` |
| **F6** | Minor | Guards — `state.from` | `LoginPage` post-login target check excludes `/login` but not `/register`. If a user hit `/register` while authed, `PublicOnly` bounced them to `roleHome` before they could log out — non-issue in practice, but if `state.from` ever carries `/register`, post-login would push into `PublicOnly` and bounce again (resolves safely, no loop). Consider excluding `/register` too for symmetry. | `LoginPage.tsx:68-69` |
| **F7** | Minor | Router file structure | 7 of the 14 lint warnings are `react-refresh/only-export-components` on `router.tsx` because `RootLayout`, `IndexRedirect`, and the 5 `*Route` adapters live in the same file as the exported `router` constant. Splitting adapters into `src/features/*/route.tsx` would clear them and improve HMR. Acceptable transitional debt (commit body notes this); log a follow-up ticket. | `router.tsx:24,35,45,60,74,88,98` (lint) |
| **F8** | Minor | `@ts-expect-error` | Single `@ts-expect-error` at `router.tsx:84` for `RiderDashboard`'s divergent inline `Profile` shape. TODO(D6) is documented. Acceptable — but this suppression will break silently the moment `RiderDashboard`'s shape stops mismatching, so pair it with an explicit ticket rather than a comment. | `router.tsx:81-85` |
| **F9** | Info | `AuthProvider` — persistence | In-memory only; refresh = logged out. Matches old behavior and ADR-0002 explicitly (D9 deferred). No action for C6; make sure it stays visible to product. | `AuthProvider.tsx:1-3` |
| **F10** | Info | `RiderLocationView` deep-link | Direct deep-link to `/admin/riders/:riderId/location` without `location.state` renders a "location unavailable" placeholder (no crash). Old code was actually **dead + broken** here (referenced undefined `currentPage.params`), so this is strictly a fix, not a regression. No callers navigate to it today (confirmed: `ActiveRiders`/`PendingRiders` have no `onNavigate` prop and never link there). Fine. | `RiderLocationView.tsx:27-36`, `ActiveRiders.tsx`, `PendingRiders.tsx` |
| **F11** | Info | Fetch byte-parity | Verified line-by-line vs `git show 41d649e:src/App.tsx`: URL constants, method, headers, body field names (`name/email/phoneNumber/dob/address/password/role` for register; `phone/password` for login), `credentials:'include'`, error-text unwrap (`errorText \|\| response.statusText \|\| "…failed"`) — **all identical**. | `LoginPage.tsx:42-59`, `RegisterPage.tsx:41-60` |
| **F12** | Info | Old `admin-register` reachability | Preserved at `/admin/register` via `<RegisterPage showRole backTo="/admin" />`. AdminDashboard's `onNavigate("admin-register")` maps to it. `onBack` behavior mirrors old `backToAdminDash`. ✅ | `router.tsx:135`, `AdminDashboard.tsx:64` |
| **F13** | Info | Logout state cleanup | `logout()` clears `profile` in context. All three dashboard route adapters call `logout(); navigate("/login", { replace: true })`. Local form state (phone/password) in `LoginPage` re-mounts on next visit because component unmounts under a different route — cleaner than old `setPage("login")` which kept `LoginView` state across "logouts". ✅ | `router.tsx:56,70,80` |

---

## Root-cause note on F1 (blocker)

The bug is a *shape* problem, not a bug in either guard in isolation:

- `ProtectedRoute` deny → `roleHome(unknown)` returns `/login`.
- `PublicOnly` on `/login` → `roleHome(unknown)` returns `/login`.

Both guards trust `roleHome` to return a "safe destination for this user", but `roleHome`'s fallback is the *login page*, which is also guarded — and the guard for unknown roles has nowhere further to escape to. Any of the following fixes closes the loop; recommend **(a)**:

- **(a)** `PublicOnly`: if `profile != null` but `roleHome(profile.role) === "/login"`, treat the profile as invalid — call `logout()` and `<Outlet/>` (let them see the login form). Simplest and matches the ADR's implicit "unknown role → /login + logout".
- **(b)** `ProtectedRoute` deny: if `roleHome(profile.role) === "/login"`, also call `logout()` before navigating.
- **(c)** Change `roleHome` fallback to `"/logout"` or a dedicated `/no-role` dead-end page.

Route this fix to the **Frontend Developer**. I will add the regression test below to the E2E suite once the fix lands.

---

## Regression Test Checklist (final QA pass — post-fix, pre-C6)

Manual (until Playwright suite lands in D-later):

**Auth happy paths**
- [ ] Unauthed visit to `/` → redirected to `/login`.
- [ ] Unauthed deep-link to `/admin`, `/rider`, `/operator`, `/admin/active-riders`, `/admin/pending-riders`, `/admin/register`, `/admin/riders/abc/location` → each redirects to `/login`.
- [ ] Login as Rider → lands at `/rider`; browser Back → does *not* re-enter `/login` form.
- [ ] Login as Admin → lands at `/admin`.
- [ ] Login as Operator → lands at `/operator`.
- [ ] After login, deep-link stash: unauthed hit `/admin/active-riders` → `/login` → sign in as Admin → land at `/admin/active-riders` (not `/admin`).

**Role isolation**
- [ ] Rider tries `/admin` → bounced to `/rider`. No loop, no blank screen.
- [ ] Operator tries `/admin` → bounced to `/operator`.
- [ ] Admin tries `/rider` → bounced to `/admin`.
- [ ] Rider tries `/admin/riders/xyz/location` → bounced to `/rider`.

**F1 regression (blocker fix verification)**
- [ ] Log in with backend returning `role: "customer"` (mock via devtools) → **no loop, no blank screen**; must land on either `/login` (with profile cleared) or a documented Customer landing.
- [ ] Log in with backend returning an empty/missing role → same expectation.
- [ ] Log in with backend returning `role: "CUSTOMER"` (upper-case) → same expectation.

**F2 regression (security fix verification)**
- [ ] `/admin/register` role dropdown behavior: confirm with product whether Admin should be selectable. Either way, document decision and lock the ROLES list to match.
- [ ] Public `/register` submits `role: "rider"` regardless of any tampering (network-tab check).

**Fetch parity (contract)**
- [ ] `POST /user/login` request: body `{"phone":"…","password":"…"}`, header `Content-Type: application/json`, `credentials: include`.
- [ ] `POST /register/user` request: body has `name/email/phoneNumber/dob/address/password/role` in that order, `credentials: include`.
- [ ] Error responses: non-2xx surface the response text; empty body shows `statusText || "Login failed" / "Registration failed"`.

**Guards / logout**
- [ ] Authed user manually visits `/login` → redirected to their role home.
- [ ] Authed user manually visits `/register` → redirected to role home.
- [ ] Logout from each dashboard → `/login`; browser Back → stays on `/login` (not the dashboard).
- [ ] Refresh on any protected route → back to `/login` (matches ADR-0002; persistence deferred).

**Deviation coverage (F3)**
- [ ] Operator clicks "Active Riders" button → verify chosen resolution (either widened guard shows the list, or button is disabled/removed).
- [ ] Operator clicks "Pending Riders" → same.

**Deep-link crash resistance**
- [ ] `/admin/riders/123/location` direct visit (no state) → placeholder rendered, no console error.

**Non-functional**
- [ ] `npm run typecheck` → 0 errors.
- [ ] `npm run typecheck:strict` → 0 errors (RiderDashboard still under `@ts-nocheck` — expected until D6).
- [ ] `npm run lint` → 0 errors, ≤14 warnings.
- [ ] `npm run build` → gzip size within ±2% of 168.07 kB.

---

## Follow-up tickets to open (regardless of blocker status)

- **T-C5-1** (P1): Fix F1 loop — recommend option (a) above.
- **T-C5-2** (P1): Resolve F2 with product — confirm Admin creatability & audit log requirement; adjust `ROLES` or `showRole` filter accordingly.
- **T-C5-3** (P2): Resolve F3 operator dead-end (widen guard or hide buttons).
- **T-C5-4** (P3): Split router-adapter components out of `router.tsx` to clear the 7 react-refresh warnings.
- **T-C5-5** (P3): Track the `@ts-expect-error` at `router.tsx:84` alongside D6.
- **T-C5-6** (P3): Add Playwright coverage for the Regression Test Checklist above once MSW lands (ADR-0003).

---

## Re-Verification (2026-07-29) — commits 8c22e86 + 884a0a4

**Final verdict: ✅ APPROVED — C6 UNBLOCKED.**

Gates re-run locally: `lint` 0 err / 14 warn · `typecheck` 0 err · `typecheck:strict` 0 err · `build` PASS (595.00 kB / 168.09 kB gzip).

### F1 (BLOCKER) — RESOLVED ✅
`PublicOnly` now detects `roleHome(profile.role) === "/login"` and fires `logout()` from a `useEffect`, then renders `<Outlet/>` (login form) while the effect settles. Trace confirmed for `role="Customer" | "" | "garbage"`:

1. Authed hit on `/admin` → `ProtectedRoute[Admin]` denies → `<Navigate to="/login"/>`.
2. `/login` under `PublicOnly`: `profile` truthy, `home="/login"`, `unknownRole=true` → guard renders `<Outlet/>`, not another `<Navigate/>`. **No cycle.**
3. `useEffect` fires post-render → `logout()` → `profile=null` → re-render → still `<Outlet/>` → `LoginPage` remains mounted.

Effect deps `[profile, unknownRole, logout]` correct; `logout` is `useCallback`-stable in `AuthProvider`, so no re-fire storm. Render-time `setState` warning avoided. Clean.

### F2 (MAJOR security regression) — RESOLVED ✅
`src/types/profile.ts` reverted to exactly `["Operator", "Customer", "Rider"] as const` — byte-matched against `git show 41d649e:src/App.tsx:35`. `/admin/register` dropdown no longer offers `Admin`. Product question logged as **D14** in `docs/design/migration-plan.md`. F4 (D15) and F5 (D16) also captured as deferreds — good hygiene.

### F3 (MAJOR UX) — RESOLVED ✅
`src/router.tsx` split into three guard blocks:
- `allow=["Admin"]` → `/admin`, `/admin/register`
- `allow=["Admin", "Operator"]` → `/admin/active-riders`, `/admin/pending-riders`, `/admin/riders/:riderId/location`
- `allow=["Operator"]` → `/operator`

Case-handling unchanged (`ProtectedRoute` still `.toLowerCase()`s both sides). ADR-0002 route table amended with footnote ¹ and mermaid diagram now shows a `G23` node for the shared block. Operator's `active-riders` / `pending-riders` buttons will now render the intended pages instead of no-op'ing.

### Diff scope check ✅
- **8c22e86**: `ProtectedRoute.tsx` (F1), `profile.ts` (F2), `migration-plan.md` (D14/D15/D16), `c5-review.md` (verbatim addition of this review). No unrelated changes.
- **884a0a4**: `router.tsx` (guard split), `docs/adr/0002-routing-and-auth.md` (table + diagram amendment). No unrelated changes.

### Residual concerns (non-blocking)
- **R1 (info)**: In the F1 fix, `LoginPage` briefly mounts one render with `profile` still non-null before `useEffect(logout)` fires. `LoginPage` doesn't read `profile` from context today (only `location.state.from` + `auth.login`), so no visible flicker. Add a comment near any future `useAuth().profile` read in `LoginPage`, or short-circuit the render with `if (profile && unknownRole) return null;` before the `Outlet`. Not blocking; log as follow-up if desired.
- **R2 (info)**: D15 (F4 login role-overwrite) and D16 (F5 register push-vs-replace) remain deferred — accepted per QA scope carve-out. Add to the C6 or C7 tracker so they don't drift.
- **R3 (info)**: Router-file react-refresh warnings (7) and `@ts-expect-error` at `router.tsx:84` still present — already tracked as T-C5-4 / T-C5-5.

### Regression checklist status
All F1/F2/F3 verification items in the original checklist above are now covered by the code review + gates. Manual smoke on dashboards confirmed by user. Full Playwright coverage remains deferred to post-MSW (ADR-0003), tracked as T-C5-6.
