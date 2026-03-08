# arken/packages/sigil-protocol/test

Jest tests for protocol schema helpers.

## Scope
- Query envelope parsing (`getQueryInput`)
- Pagination compatibility (`take` + `limit` aliasing in both directions)
- Conflict normalization (`take` wins when `take` and `limit` disagree)
- Pagination validation (reject negative and non-integer `skip`/`take`/`limit`)
- Logical filter compatibility (`NOT` object shorthand)
- Field-filter nested `not` operator compatibility (`name: { not: { contains: ... } }`)
- String-filter `mode` validation (`default`/`insensitive` accepted; unsupported modes rejected)
- String-only operator scoping (reject `contains`/`mode` on non-string fields)
- Optional string field compatibility (`z.string().optional()` supports `contains`/`mode`)
- Date shorthand filter compatibility (`where: { createdAt: new Date(...) }` keeps `{ equals: Date }` semantics)
- `orderBy` compatibility (single object and Prisma-style array envelopes)
- Legacy uppercase `orderBy` directions (`ASC`/`DESC`) normalize to Prisma-compatible lowercase output
