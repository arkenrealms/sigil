<!-- agents.md -->
# OneJS Sigil Protocol (package)

## Intention
The Sigil protocol package defines the **canonical tRPC router contract** for the Sigil runtime:
- namespaces like `core` and `game`
- event-style procedures (`onInitialized`, `onAuthorized`, etc.)
- zod-validated inputs/outputs

Its main purpose is to provide **shared type safety** across:
- OneJS runtime (actual server/router execution)
- React Forge (typed “sigil client” that emits Unity stream commands)
- any other clients that need to invoke Sigil procedures

## Design constraints
- The protocol must be **importable as types in browser builds**
- If runtime router builders are exported, they must not require Node-only dependencies
- Consumers should derive types from the **router factory** rather than redeclare shapes

## Public API
### Router factory (preferred)
Export a router builder:
- `createRouter(t)` or `createRouter()` (depending on your design)

Consumers should derive the router type from the factory:
- `type SigilAppRouter = ReturnType<typeof createRouter>`

This avoids drift where `type Router = ...` becomes stale.

### Router type export (optional)
If you export `export type Router = ...`, ensure it is **the actual router type** (not an interface approximation).
If it becomes hard to keep correct, prefer “derive from factory” in all consumers.

## Important files
- `modules/core/*`
  - procedure definitions for core lifecycle/auth/events
- `modules/game/*`
  - game-related procedures/events
- `index.ts`
  - re-exports `createRouter` and/or `Router` type

## Naming conventions
- Procedures that represent Unity->JS or JS->Unity “events” are named `onX`
- Avoid mixing query-style naming with event semantics unless you intend it
- Keep namespaces stable (`core`, `game`)

## Debugging checklist
- If consumers can’t see `core.onInitialized`:
  - confirm it exists in the router factory output
  - ensure it’s exported from package entrypoint
  - ensure consumers use `ReturnType<typeof createRouter>` instead of a stale `Router` alias