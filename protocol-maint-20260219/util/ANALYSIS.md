# arken/packages/sigil-protocol/util ANALYSIS

- `getQueryInput` previously dropped Prisma-style `take` because only `limit` existed.
- Added explicit `take` support while retaining `limit` to avoid breaking existing callers.
- Added normalization so `limit`-only inputs are mirrored into `take`, preventing downstream pagination drift.
- Added reciprocal normalization so `take`-only inputs are mirrored into `limit`, preserving backward-compatibility for callers still keyed on `limit`.
- Added conflict normalization for mixed `take`/`limit` envelopes: `take` is canonical and `limit` is rewritten to match.
- Added non-negative integer validation for `skip`/`take`/`limit` to fail fast on invalid pagination payloads before resolver/database execution.
- `createPrismaWhereSchema` now accepts single-object logical filters (`NOT`/`AND`/`OR`) in addition to arrays, matching common Prisma-style payloads.
- Field-level `not` now supports nested operator objects (not only scalar values), which aligns with Prisma filter semantics and avoids rejecting valid caller payloads.
- Tightened string-filter `mode` to Prisma-compatible enum values (`default`/`insensitive`) instead of unrestricted strings, preventing silent acceptance of unsupported modes.
- Scoped string-only operators (`contains` / `startsWith` / `endsWith` / `mode`) to string fields only; this prevents invalid filter payloads from being accepted for numeric/date fields and shifts failures to schema-parse time.
- Fixed optional/nullable/default/effects wrapper handling when inferring field type so optional string fields still expose valid string operators (previously `z.string().optional()` was misclassified and rejected `contains`/`mode`).
- Added `orderBy` compatibility for both single-object and Prisma-style array envelopes, reducing query-shape rejection for multi-sort callers.
- Added test coverage to lock pagination behavior and shorthand `where` conversion, including invalid pagination rejection and `orderBy` array support.
- Fixed shorthand filter coercion for non-plain object scalars (e.g. `Date`): only plain objects are treated as operator envelopes, so `where: { createdAt: new Date(...) }` now correctly normalizes to `{ createdAt: { equals: ... } }` instead of being stripped.
- Added `orderBy` direction normalization for uppercase legacy values (`ASC`/`DESC`) so incoming payloads are accepted while parsed output is canonical lowercase (`asc`/`desc`).
