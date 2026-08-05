# Claude — Read AGENTS.md First

**[`AGENTS.md`](AGENTS.md) is the canonical rules file for this repo.**
Load it before doing any work.

The four hard rules most easily broken (full list in AGENTS.md):

1. **API shape is frozen**: `POST /user/login` body is `{ phone, password }`
   (NOT `{ email, password }`). Do not change without an ADR.
2. **Never widen `ROLES`** (`["Operator", "Customer", "Rider"]`).
   Adding `Admin` as a creatable role is a security regression (QA F2).
3. **Never delete the Customer seed user** in `src/mocks/handlers/auth.ts`.
   It is the QA-F1 regression tripwire.
4. **All four gates green before every commit**: lint, typecheck,
   typecheck:strict, build.

Read [`local-docs/PROJECT.md`](local-docs/PROJECT.md) for current state and
[`local-docs/design/migration-plan.md`](local-docs/design/migration-plan.md)
§"Deferred Work Register" for known debt before starting work.
