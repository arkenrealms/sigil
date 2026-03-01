# arken/packages/sigil-protocol/test ANALYSIS

- Added focused regression tests for `getQueryInput`.
- Validates Prisma-style `take` preservation, legacy `limit` compatibility, and bidirectional `take`/`limit` normalization.
- Validates conflicting `take` + `limit` envelopes normalize to `take` as canonical.
- Validates pagination fields reject invalid values (negative and non-integer numbers).
- Validates Prisma-style single-object `NOT` clauses are accepted and normalized.
- Validates field-level nested `not` operator objects are accepted (Prisma-compatible filter shape).
- Validates string-filter `mode` accepts Prisma-compatible values and rejects unsupported values.
- Validates string-only operators are rejected on non-string fields, preventing invalid Prisma filter construction for number/date fields.
- Adds regression coverage for optional string fields to ensure wrapped string schemas (`z.string().optional()`) still accept string operators.
- Validates Date shorthand filters are preserved as `{ equals: Date }` instead of being dropped when non-plain object values are provided.
- Validates `orderBy` parsing supports Prisma-style array envelopes and rejects unsupported direction values.
- Adds compatibility coverage for uppercase sort directions (`ASC`/`DESC`) to ensure parsed `orderBy` output is normalized to lowercase Prisma directions.
- Uses repo-defined `npm test` script (dist + jest) to satisfy source-change test gate.
