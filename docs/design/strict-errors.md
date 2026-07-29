# TypeScript Strict Mode — Error Baseline

Captured during Checkpoint 3.5 of the restructure. `"strict": false` remains in
`tsconfig.json` this iteration per plan. Flipping strict on = its own future PR
after these errors are fixed (deferred register **D6**).

Command:
```
npm run typecheck:strict   # tsc --noEmit --strict
```

## Baseline (post-C3 tooling install)

**10 errors, all in 2 files** — both scheduled for rewrite in Checkpoints 4 and 5.

```
src/app/App.tsx(230,43): error TS2353: Object literal may only specify known properties, and 'profile' does not exist in type 'Profile'.
src/app/App.tsx(234,46): error TS2353: Object literal may only specify known properties, and 'profile' does not exist in type 'Profile'.
src/app/App.tsx(238,43): error TS2353: Object literal may only specify known properties, and 'profile' does not exist in type 'Profile'.
src/app/App.tsx(309,24): error TS2322: Type '(p: Page, params?: NavigateParams | undefined) => void' is not assignable to type '(p: Page, profile?: Profile | undefined) => void'.
src/app/App.tsx(339,65): error TS2304: Cannot find name 'currentPage'.
src/app/App.tsx(339,85): error TS2322: Type '{ params: any; onNavigate: (p: Page, params?: NavigateParams | undefined) => void; }' is not assignable to type 'IntrinsicAttributes & { params: any; }'.
src/app/App.tsx(355,115): error TS2322: Type 'Profile | undefined' is not assignable to type '{ role: string; name: string; address: string; rideArea: string; dob: string; joiningDate: string; totalRides: number; missedRides: number; distanceTraveled: number; online: boolean; currentLocation: { ...; }; ratings: number; lastCustomerId: string; } | undefined'.
src/app/pages/RiderDashboard.tsx(121,31): error TS2339: Property 'area' does not exist on type '{ role: string; name: string; address: string; rideArea: string; dob: string; joiningDate: string; totalRides: number; missedRides: number; distanceTraveled: number; online: boolean; currentLocation: { ...; }; ratings: number; lastCustomerId: string; }'.
src/app/pages/RiderDashboard.tsx(203,12): error TS2769: No overload matches this call.
src/app/pages/RiderDashboard.tsx(211,14): error TS2769: No overload matches this call.
```

## Analysis

| File | Errors | Disposition |
|------|--------|-------------|
| `src/app/App.tsx` | 7 | File is deleted in Checkpoint 5 (split into `AuthProvider`, `LoginPage`, `RegisterPage`, `router.tsx`). Errors resolve during rewrite. |
| `src/app/pages/RiderDashboard.tsx` | 3 | File is `git mv`'d in Checkpoint 4 and re-wired to route params in Checkpoint 5. `profile?.area` (line 121) is a real bug — the field is `rideArea`. Correct in C5 rewrite. |

## Non-Strict Baseline (post-C3, same tooling)

**Same 10 errors** — because the codebase already has explicit type annotations
in most places; `noImplicitAny` doesn't uncover new problems here. This means
flipping `"strict": true` is essentially free once the 10 real errors above are
fixed. Tracked under **D6**.

## Suppression Strategy (C3 → C5)

Per LINT FINDINGS POLICY (targeted disables with TODOs), these two files carry
per-file suppressions until they are rewritten:

- `src/app/App.tsx` — `@ts-nocheck` + eslint-disables for the pre-existing
  unused-vars and `Boolean`-wrapper bugs.
- `src/app/pages/RiderDashboard.tsx` — `@ts-nocheck` + eslint-disable for
  unused params.

Both suppression blocks reference `D6` and the target checkpoint. All
suppressions must be removed as part of C5.

## Bundle Impact

None. Suppression comments are stripped at build time; bundle hashes remained
identical across C1 → C2 → C3.
