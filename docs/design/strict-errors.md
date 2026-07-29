# TypeScript Strict Mode — Error Baseline

Captured through Checkpoint 5 of the restructure. `"strict": false` remains in
`tsconfig.json`, but `npm run typecheck:strict` now runs clean.

Command:
```
npm run typecheck:strict   # tsc --noEmit --strict
```

## Post-C5 Status

**0 errors.**

```
$ npm run typecheck:strict
> tsc --noEmit --strict
$ echo $?
0
```

## History

| Checkpoint | Errors | Notes |
|------------|--------|-------|
| C3 baseline | 10 | 7 in `src/app/App.tsx`, 3 in `src/app/pages/RiderDashboard.tsx` |
| C4 | 10 | files `git mv`'d only — errors carried forward, unchanged |
| **C5** | **0** | `App.tsx` deleted; router + auth + login/register are strict-clean from the start |

## Remaining Suppressions

Two suppressions remain, both tagged **D6**:

- `src/features/dashboards/RiderDashboard.tsx` — full-file `@ts-nocheck` +
  `eslint-disable @typescript-eslint/no-unused-vars`. The file declares its own
  inline `Profile` shape (`rideArea` / `distanceTraveled` / `ratings`) that
  diverges from the canonical `src/types/profile.ts`, plus a pre-existing
  `profile?.area` typo (real bug — the field is `rideArea`). Rewriting the file
  to unify types is deferred to a follow-up PR (D6).
- `src/router.tsx:84` — single-line `@ts-expect-error` on the
  `RiderDashboardRoute` adapter that passes the canonical `Profile` to
  `RiderDashboard`'s divergent inline type. Resolves automatically the moment
  RiderDashboard is unified with `@/types/profile`.

## Bundle Impact

None. Comment-only.

## Flipping `strict: true`

Blocked only by removing the two suppressions above (D6). Zero blast radius on
main source once that unification lands.
