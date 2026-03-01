# arken/packages/sigil-protocol/util

Shared schema helpers for Sigil protocol routers.

## Notes
- `getQueryInput` accepts both `take` and `limit` pagination keys.
- Prefer `take` for Prisma-style callers; keep `limit` for compatibility.
- When only `limit` is provided, parsing now mirrors it into `take` for downstream Prisma-style consumers.
- When only `take` is provided, parsing mirrors it into `limit` to preserve legacy callers that still read `limit`.
- If both `take` and `limit` are provided but differ, `take` is treated as canonical and `limit` is normalized to match.
- Pagination fields (`skip`/`take`/`limit`) are validated as non-negative integers to prevent invalid downstream query envelopes.
- `createPrismaWhereSchema` logical operators (`AND`/`OR`/`NOT`) accept either a single where object or an array.
- Field-level `not` filters accept both scalar shorthand values and nested operator objects (Prisma-compatible), e.g. `{ name: { not: { contains: 'foo' } } }`.
- Scalar shorthand now correctly preserves non-plain object values (for example `Date`) by mapping them to `{ equals: value }` instead of treating them like operator envelopes.
- String-filter `mode` is constrained to Prisma-compatible values (`default` | `insensitive`) to reject unsupported options early.
- String-only operators (`contains` / `startsWith` / `endsWith` / `mode`) are now only accepted on string fields to fail fast before invalid Prisma query construction on numeric/date fields.
- Optional/nullable/default-wrapped string fields are unwrapped before filter generation, so valid string operators continue to work on fields like `z.string().optional()`.
- `orderBy` accepts both a single object and Prisma-style arrays of objects (e.g. `[{ level: 'desc' }, { name: 'asc' }]`).
- Legacy uppercase sort directions (`ASC`/`DESC`) are normalized to lowercase before validation for compatibility with older clients.
