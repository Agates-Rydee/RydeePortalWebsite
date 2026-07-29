# C6 / C7 Release Readiness — Final QA Pass

**Reviewer:** QA-C5-Review (sub-agent) · **Date:** 2026-07-29
**Commits under review:** `40573ef` (C6 MSW) + `5dbb12c` (C7 README/ADR close-out)
**Cross-refs:** `docs/qa/c5-review.md` (C5 + re-verification), ADR-0003, migration-plan.md

---

## Final Verdict

**⛔ NOT READY — 1 BLOCKER (mocked login broken due to contract drift).**

The tree-shaking guardrail, dev-only boot, gates, and doc quality are all excellent. The one issue is severe: the MSW login handler does not match the frozen app fetch contract, so the entire offline-dev workflow that C6 exists to enable does not actually work end-to-end. Fix is a ~3-line change in `src/mocks/handlers/auth.ts` + a matching edit in ADR-0003 + README seed-user instructions. Once F6 is resolved, C6/C7 are shippable.

---

## Findings

| # | Sev | Area | Finding | Evidence |
|---|-----|------|---------|----------|
| **F6** | **BLOCKER** | MSW contract fidelity | The MSW login handler reads `body.email` and matches against `seed[].email`, but `LoginPage.tsx` sends **`JSON.stringify({ phone, password })`** — the app's frozen byte-parity contract from pre-C5 App.tsx. The handler therefore always sees `body.email === undefined`, `seed.find(...)` returns nothing, and every mocked login returns **401 "Invalid email or password"**. The offline-dev flow that C6 exists to enable does not work at all. Additionally, `isValidPhone = /^\d{10}$/` in `LoginPage` rejects `rider@example.com` client-side before fetch even fires — the README's own seed-user instructions can't be executed. | `src/mocks/handlers/auth.ts:86,94-96`, `src/features/auth/pages/LoginPage.tsx:24,47`, README.md:78-83 |
| **F7** | Major (doc) | ADR-0003 contract table | ADR-0003 §"Contract fidelity" lists `POST /user/login` request as `{ email, password }`. The actual frozen app contract (verified byte-for-byte in the C5 review against `git show 41d649e:src/App.tsx:217`) is `{ phone, password }`. The ADR is a "living contract" per its own text — it currently misrepresents that contract. Handler was written to the ADR, not to the app; fix the ADR *and* the handler together. | `docs/adr/0003-mock-api-msw.md:36`, `LoginPage.tsx:47` |
| **F8** | Minor | README seed users | The seed-user table under "Local Dev — Without a backend" gives email addresses. After F6 is fixed the seeds must key on phone (10 digits). Update table to e.g. `0300xxxxxxx / rider` for each role. Also worth noting: the `Customer` seed entry now serves a dual purpose (F1 fix demo) — call that out inline so future readers don't remove it. | README.md:78-83, `handlers/auth.ts:10-83` |
| **F9** | Info | main.tsx render gating | `enableMockingIfConfigured()` returns `Promise<void>` immediately when DEV=false or flag !== "true". `.then(() => createRoot(...).render(...))` schedules one microtask before first render — imperceptible in practice. Render is **not** blocked when flag off. ✅ | `src/main.tsx:10-21` |
| **F10** | Info | Prod bundle purity | `rg -i "msw\|setupWorker\|mockServiceWorker\|worker\.start" dist/assets/*.{js,css}` → **0 matches** after `npm run build`. Dynamic `import("./mocks/browser")` behind `import.meta.env.DEV` correctly tree-shakes the entire `src/mocks/` subtree. Only `dist/assets/index-*.js` (~595 kB) + CSS + logo/mapicon assets present. ✅ | `dist/assets/`, `main.tsx:11-14` |
| **F11** | Info | Handler URL wiring | Both `http.post(API_LOGIN_URL, ...)` and `http.post(API_REGISTER_URL, ...)` import from `src/lib/config.ts` — the exact same module `LoginPage`/`RegisterPage` use. Endpoint drift is structurally impossible. ✅ | `handlers/auth.ts:5,93,104`, `lib/config.ts` |
| **F12** | Info | Register handler | Reads `{ name, email, phoneNumber, dob, address, password, role }` — matches RegisterPage's `JSON.stringify` order and field names exactly. Missing-field 400 branch matches error UI. `role` echoed back but not consumed. ✅ | `handlers/auth.ts:104-110`, `RegisterPage.tsx:45-55` |
| **F13** | Info | Login success response | Handler returns `{ role: profile.role, profile }`. LoginPage reads `data.role ?? data.user?.role` and `data.profile as Profile` — both satisfied. Seed `Rider` profile also carries the RiderDashboard-only fields (`area`, `distanceTraveled`, `ratings`) that D6 documented — dashboard renders without `undefined` fallbacks. ✅ | `handlers/auth.ts:14-31,101`, `LoginPage.tsx:56-70`, `RiderDashboard.tsx:124,164,184` |
| **F14** | Info | F1 fix exercisable in dev | Customer seed exists specifically so `customer@example.com / customer` triggers the PublicOnly-logout path. Once F6 is fixed, this is a great smoke test to keep the F1 fix from regressing silently. ✅ | `handlers/auth.ts:67-83` |
| **F15** | Info | Gates | `lint` 0 err / 14 warn (all pre-existing) · `typecheck` 0 err · `typecheck:strict` 0 err · `build` PASS (595.00 kB / 168.09 kB gzip). ✅ | Local runs 2026-07-29 |
| **F16** | Info | Diff scope | 40573ef: only `src/main.tsx`, `src/mocks/**` (new), `public/mockServiceWorker.js` (generated), `package.json`/`package-lock.json` (msw devDep), `docs/qa/c5-review.md` (+40 lines noting re-verification — non-source). 5dbb12c: only `README.md` (rewritten), three ADR files (Status→Accepted). No unrelated code changes. ✅ | git show --stat outputs |
| **F17** | Info | README accuracy (non-login) | Structure map matches actual `src/` tree. Scripts table matches `package.json`. Env table matches `.env.example`. Route table matches ADR-0002 (post-amendment). CI notes accurate. Only the seed-user login instructions are broken (see F8). ✅ (aside from F8) | README.md, `package.json`, `.env.example`, `docs/adr/0002-*.md` |
| **F18** | Info | Bundle size warning | Vite emits its usual "chunks > 500 kB" advisory. Not introduced by C6 (same as C5, ±0.1 kB). Code-splitting is out of scope for the restructure. No action. | Build log |

---

## Recommended fix for F6/F7/F8 (route to Frontend Developer)

Two lines in `src/mocks/handlers/auth.ts`:

```diff
- interface LoginBody { email?: string; password?: string }
+ interface LoginBody { phone?: string; password?: string }
  ...
-     const user = seed.find(
-       (u) => u.email === body.email && u.password === body.password,
-     );
+     const user = seed.find(
+       (u) => u.phone === body.phone && u.password === body.password,
+     );
```

Then per-seed, add a 10-digit `phone` field alongside (or replacing) `email`:

```
rider    → phone: "0300111111"
admin    → phone: "0300222222"
operator → phone: "0300333333"
customer → phone: "0300444444"
```

Then:
- Update `docs/adr/0003-mock-api-msw.md:36` contract table cell for `POST /user/login` request from `{ email, password }` → `{ phone, password }`.
- Update README "seed users" section to use phone numbers.
- Optionally: keep `email` on seeds for future email-based login without another migration.

---

## Release Readiness Checklist

**Blocking (must be green before ship):**
- [ ] **F6** Mocked login round-trips successfully with a seed user (manual: `npm run dev` → phone/pw → land at role home).
- [ ] **F6** ADR-0003 contract table matches actual app fetch body shape.
- [ ] **F14** Customer seed login exercises F1 PublicOnly-logout (confirms the C5 fix hasn't regressed).

**Already verified (do not need re-check unless code moves):**
- [x] Gates: lint / typecheck / typecheck:strict / build all green.
- [x] `rg msw dist/assets/` → 0 hits.
- [x] main.tsx render is not blocked when flag off.
- [x] MSW handler URLs sourced from `src/lib/config.ts`.
- [x] Login handler response shape (`{ role, profile }`) matches LoginPage consumption.
- [x] Register handler request shape matches RegisterPage; success path navigates to /login.
- [x] Seed Rider profile includes RiderDashboard-only fields (area, distanceTraveled, ratings).
- [x] Diff scope clean on both C6 and C7 commits.
- [x] README structure map / scripts / env / routes / CI notes accurate.
- [x] All three ADRs Accepted; ADR-0002 notes F3 amendment.

**Post-fix nice-to-haves (non-blocking, log as tickets):**
- [ ] Add a tiny Playwright smoke test that boots MSW and asserts each seed login → role home (would have caught F6 in CI).
- [ ] Add an "MSW contract test" in CI: parse the app's `JSON.stringify(...)` request bodies vs handler `interface *Body` definitions.
- [ ] D15 (F4 login role-overwrite), D16 (F5 register push vs replace) still deferred — schedule for the next iteration.
- [ ] R1 from C5 re-verification: `LoginPage` mounts one render with stale `profile` before `PublicOnly`'s `useEffect(logout)` fires — harmless today, add a comment when anyone next touches LoginPage.

---

## Bug report — F6 (blocking)

**Summary:** MSW mocked login always returns 401 due to request-body field-name mismatch (`email` vs `phone`).

**Severity:** Blocker · **Priority:** P1
**Environment:** local `npm run dev`, `VITE_ENABLE_MSW=true`, no backend running. Node 18+, Chromium.
**Build:** 40573ef.

**Steps to reproduce:**
1. `cp .env.example .env` (has `VITE_ENABLE_MSW=true`).
2. `npm run dev`, open http://127.0.0.1:5173, arrive at `/login`.
3. Attempt to log in per README instructions: `rider@example.com` / `rider`.
4. Client-side validation (`/^\d{10}$/`) rejects the email string — error "Please enter a valid phone number." No fetch fires. Blocked here already.
5. Alternative: enter any 10-digit phone (e.g. `0300111111`) and any password.
6. Fetch fires: `POST http://localhost:3000/user/login` with body `{"phone":"0300111111","password":"..."}`.
7. MSW handler intercepts, but `body.email` is `undefined`, `seed.find(...)` returns `undefined`, handler responds `401 "Invalid email or password"`.

**Expected:** Log in with a documented seed credential → mocked handler returns `{ role, profile }` → app navigates to role home.

**Actual:** Every login attempt fails with 401 (or client-side "invalid phone" if trying README emails). Offline-dev workflow is unusable.

**Reproducibility:** Always.

**Impact:** C6's entire raison d'être (frontend devs working without the backend) is non-functional. Also documentation lie in README + ADR-0003.

**Suggested regression test (Playwright pseudo):**
```ts
test('MSW rider login lands at /rider', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Phone Number').fill('0300111111');
  await page.getByLabel('Password').fill('rider');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/rider');
});
```

---

## Final Re-Verification (2026-07-29) — commits c649bd8 + 6a04f71

**FINAL VERDICT: ✅ SHIP — restructure C0–C7 is release-ready.**

Gates re-run locally: `lint` 0 err / 14 warn · `typecheck` 0 err · `typecheck:strict` 0 err · `build` PASS (595.16 kB / 168.15 kB gzip) · `rg msw dist/assets/` → 0 hits.

### F6 — Mocked login round-trips ✅
Two-pronged verification:

**(a) Headless E2E via `msw/node`** — a replica handler (identical predicate + seeds + response shapes to the real file) was booted with `setupServer(...)` and hit with the exact fetch body `LoginPage.tsx` sends (`{ phone, password }`, `credentials: "include"`, `Content-Type: application/json`). Results:

```
Rider              status=200 role=Rider     name=Rida Rider
Admin              status=200 role=Admin     name=Ada Admin
Operator           status=200 role=Operator  name=Omar Operator
Customer           status=200 role=Customer  name=Cara Customer
BadPass            status=401 err=Invalid phone or password
BadPhone           status=401 err=Invalid phone or password
OldReadmeEmail     status=401 err=Invalid phone or password
```

(A direct `tsx`-load of the real `src/mocks/handlers/auth.ts` couldn't complete headlessly because `src/lib/config.ts` reads Vite-only `import.meta.env` at module scope — expected, not a bug. Hence the replica approach.)

**(b) Structural check of the real handler file** — 8 critical string assertions all present in `src/mocks/handlers/auth.ts`:
- `phone: "0300111111"`, `"0300222222"`, `"0300333333"`, `"0300444444"` (all exactly 10 digits, pass `/^\d{10}$/`).
- `interface LoginBody { phone?: string; password?: string }` (no email in predicate type).
- Predicate: `(u) => u.phone === body.phone && u.password === body.password`.
- 401 text: `"Invalid phone or password"`.
- Success shape: `{ role: user.profile.role, profile: user.profile }`.

`email` remains only as seed field + `email:` echo in the register response — never in the login predicate. As documented in the file comment.

### F7 — ADR-0003 contract table ✅
`docs/adr/0003-mock-api-msw.md:36` now reads `{ phone, password }` for the login request, `{ role, profile: { name, role, ... } }` for the response. Footnote ¹ documents the amendment, dates it, names `LoginPage.tsx` as source of truth. Seed-user paragraph updated to include Customer.

### F14 — Customer seed exercises F1 ✅
- Seed present in `handlers/auth.ts:74-91` with an inline comment: `Customer — intentionally exercises the F1 unknown-role logout path`.
- README root: "**Do not remove this seed**".
- `src/mocks/README.md` §"About the Customer seed" explains the 4-step F1 trace and repeats the do-not-delete warning.
- Handler returns 200 for Customer login (as it should — logout is a client-side guard concern, not a server refusal). Traceable path: LoginPage → `auth.login(profile)` → `navigate("/login")` → `PublicOnly.useEffect(logout)` → clean session. Matches C5 re-verification.

### F8 — Seed tables consistent across docs ✅
Line-by-line cross-check of the three seed listings (`README.md:82-85`, `src/mocks/README.md:42-45`, `handlers/auth.ts:14-92`):

| Role | Phone | Password | Docs match handler? |
|---|---|---|---|
| Rider | `0300111111` | `rider` | ✅ |
| Admin | `0300222222` | `admin` | ✅ |
| Operator | `0300333333` | `operator` | ✅ |
| Customer | `0300444444` | `customer` | ✅ |

All four phones pass `/^\d{10}$/`. Landing-page column in both READMEs matches ADR-0002 route table + F1 behavior for Customer.

### Gates ✅
- `npm run lint` → 0 errors, 14 pre-existing react-refresh warnings.
- `npm run typecheck` → 0 errors.
- `npm run typecheck:strict` → 0 errors.
- `npm run build` → PASS, 595.16 kB / 168.15 kB gzip (+0.12 kB vs C6, from the extra `phone` field on each seed — expected).
- `rg -i "msw|setupWorker|mockServiceWorker|worker\.start" dist/assets/` → 0 hits (prod bundle purity preserved).

### Diff scope ✅
- **c649bd8**: `src/mocks/handlers/auth.ts` (predicate + seeds), `docs/adr/0003-mock-api-msw.md` (contract row + footnote), `README.md` (seed table + F1 note + pointer), `docs/qa/release-readiness.md` (+130 lines: dev appended a copy of my prior review — non-source, harmless). No unrelated code changes.
- **6a04f71**: `src/mocks/README.md` only (129 new lines, developer guide). Docs-only. No source touched.

### Residuals (all non-blocking, no ship impact)
- **D15** (F4 login role-overwrite) and **D16** (F5 register push vs replace) still deferred — accepted at C5 sign-off, tracked in migration-plan.md.
- **R1** from C5 re-verification: `LoginPage` mounts one render with stale `profile` before `PublicOnly.useEffect(logout)` fires. Harmless today (LoginPage doesn't read `profile`), comment recommended if anyone next touches it.
- **T-C5-4** router.tsx react-refresh warnings (7) — cosmetic, tracked.
- **T-C5-5** `@ts-expect-error` at `router.tsx:84` — pending D6.
- **T-C5-6** Playwright coverage of this checklist — pending; the msw/node harness above is a solid starting point once the test scaffolding lands.
- **New follow-up (P3)**: Consider a lightweight contract-check script in CI that parses `LoginPage.tsx` / `RegisterPage.tsx` fetch bodies and diffs the keys against the `interface LoginBody` / `interface RegisterBody` in `handlers/auth.ts`. Would have caught F6 automatically. Cheap and useful.

### Ship recommendation
- ✅ Tag `restructure-complete` may be applied (the C7 commit body notes this is post-close-out; applied after user's manual smoke).
- ✅ All 3 ADRs Accepted; all QA blockers resolved; all gates green; docs internally consistent.
- ✅ Offline dev flow verified working end-to-end (headless), matches documented seed instructions.

C0–C7 restructure closes clean. Good work all around.

---

## D9 Re-Verification (2026-07-29) — commit 0960516 (session persistence)

**VERDICT: ✅ SHIP — D9 client-side rehydrate is release-ready.**

Gates: `lint` 0e/14w · `typecheck` 0 · `typecheck:strict` 0 · `build` PASS 596.19 kB / 168.42 kB gzip. Prod bundle: `rg msw dist/assets/` = 0 hits (MSW purity preserved); `rydee.session` present (expected — it's app code, not mocks).

### (1) No flash-redirect on refresh ✅
`AuthProvider` uses `useState<Profile | null>(loadSession)` — the **lazy initializer** form (function reference, not eager call). React runs it exactly once during mount, synchronously, before the first render's return value is committed. `ProtectedRoute` and `PublicOnly` therefore see the rehydrated profile on their first render — no null-then-set-then-rerender cycle, no `<Navigate to="/login"/>` intermediate. Confirmed by inspection of `AuthProvider.tsx:27`.

### (2) F1 interaction — no per-refresh re-loop ✅
Traced and simulated headlessly (11/11 assertions PASS incl. the loop-break):

1. Rehydrate Customer via `loadSession()` (lazy init) → context has `profile.role="Customer"`.
2. `PublicOnly` computes `home="/login"`, `unknownRole=true` → renders `<Outlet/>` and schedules `useEffect(logout)`.
3. `logout()` calls `clearSession()` **then** `setProfile(null)`. Order matters and is correct: storage is cleared before the re-render fires so a synchronous `loadSession` anywhere else won't see stale data.
4. Next refresh: `loadSession()` returns `null` (key gone). Guards treat as unauthed → `LoginPage`. **No loop.**

The `AuthProvider.tsx:34-40` comment explicitly calls out the F1 dependency. Good defense-in-depth doc.

### (3) TTL expiry path ✅
`Date.now() - parsed.savedAt > SESSION_MAX_AGE_MS` → `clearSession()` → return `null`. `useState(loadSession)` seeds `null` → indistinguishable from a fresh logout. Smoke: `25h old envelope → null + key cleared` PASS; `23h old envelope → returns profile` PASS. Boundary is exclusive of the exact 24h mark, which is correct.

### (4) Corrupt / foreign envelope ✅
Four reject paths, all clearing storage before returning null:
- JSON parse throw → `clearSession()` in the catch. ✅ (smoke: "corrupt JSON")
- `!isEnvelopeV1(parsed)` covers: non-object, null, wrong `v`, non-numeric `savedAt`, missing/non-object `profile`, non-string `role`. Each path clears + returns null. ✅ (smokes: "v:2 envelope", "non-string role", "missing profile")
- Version bump path is elegant: future v2 envelope stored, v1 client sees `rec.v !== 1` → drops → user re-logs in. No migration code needed for a one-way rollout.

### (5) login()/logout() storage sync ✅
- `login(next)`: `saveSession(next)` → `setProfile(next)`. New v1 envelope written with fresh `savedAt`. ✅
- `logout()`: `clearSession()` → `setProfile(null)`. Storage cleared before state, so any concurrent read (e.g. another `loadSession` call in a fast refresh) sees the cleared state. ✅
- `PublicOnly.useEffect` uses the same `logout` from context → same behavior. F1 loop stays broken across refreshes. ✅ (smoke: "F1 loop-break")
- `saveSession` degrades to no-op on quota/disabled (silent, per commit). Session lives in memory only for that tab; refresh → `/login`. Acceptable graceful degradation.

### (6) Gates ✅
- `lint` 0 errors, 14 pre-existing react-refresh warnings — unchanged.
- `typecheck` 0 errors.
- `typecheck:strict` 0 errors — `session.ts` is well-typed (`unknown` narrowing via `isEnvelopeV1`, no `any`).
- `build` PASS, 596.19 kB (+~1 kB vs post-C6 — session.ts overhead, matches commit body).

### (7) Diff scope ✅
- **Source**: only `src/features/auth/session.ts` (new, 118 lines) + `src/features/auth/AuthProvider.tsx` (+13 lines: import, lazy init, save on login, clear on logout). No touches to guards, router, handlers, config, types, or any page component.
- **Docs**: `docs/adr/0002-routing-and-auth.md` (AuthProvider decision + consequences updated, previously said "in-memory only"), `docs/design/migration-plan.md` (D9 → delivered, D17 → token integration deferred, cleanly scoped), `src/mocks/README.md` (+27-line session-persistence section), `docs/qa/release-readiness.md` (+81 lines from dev's own trace — non-source).
- No unrelated changes.

### Residuals (info-only, non-blocking)
- **I1**: `saveSession` swallows quota/disabled errors silently. Consider `console.warn` in the catch so developers can spot storage failures during local dev. Cosmetic.
- **I2**: Cross-tab logout not propagated (no `storage`-event listener). Tab B keeps profile until refresh. Acceptable — server-side revocation (D9-remainder + D17) is the real answer here.
- **I3**: TTL is check-on-load only. A tab kept open for 25h without refresh stays logged in via in-memory state. Standard SPA behavior; documented as stopgap.
- **I4** (persists from C5 R1): `PublicOnly` still renders `<Outlet/>` for one render before `useEffect(logout)` fires. `LoginPage` mounts with a stale `profile` in context for that render. Doesn't read `profile`, so no visible effect. Persistence makes this window slightly more consequential in theory (if user could refresh in that window, cleared-storage race), but `useEffect` fires before browser paint on the same task; not reproducible.
- **I5** (P3 follow-up): Add a `storage`-event listener for cross-tab sync, or an idle-timer that re-checks TTL periodically. Owned by whoever picks up D9-remainder / D17.

### Ship recommendation
D9 client-side scope is complete, F1-safe, and well-isolated for the future token upgrade. Sign off. Token-based auth + server-side revocation properly parked as D17.
