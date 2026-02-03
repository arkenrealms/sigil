<!-- agents.md -->
# OneJS Side (Sigil runtime)

## Intention
The OneJS/Sigil runtime is the **authoritative “game/app runtime”** that runs inside Unity (Puerts/OneJS). It hosts:
- **Local tRPC routers** (core/game) executed inside the same JS runtime
- **Remote tRPC callers** to Unity-backed services (seer/evolution/forge relays)
- **Stream sockets** that bridge Unity events into JS and JS commands back into Unity

The system is designed so the OneJS runtime has a **single “caller” surface** that merges:
- local routers (core/game)
- remote routers (seer/evolution/forge)

This allows code to call `caller.sigil.core.*` and `caller.seer.*` with the same mental model.

## High-level architecture
### 1) Unity Stream Bridge
Unity emits events to JS via a stream bridge (e.g. `CS.Arken.Bridge.Instance.OnStreamEvent`).
JS registers listeners with `createUnityStreamSocket(streamName)` and receives `(eventName, payload)`.

JS can also emit back to Unity with `socket.emit(eventName, payload)`.

### 2) Local tRPC routers
Within OneJS we build local routers using `initTRPC.context<AppCtx>().create()` and expose them through a local caller.
Local invocation is performed via `t.createCallerFactory(router)(ctx)` and dispatched by string path.

### 3) Remote tRPC callers
Remote calls to Unity backends/services are performed via a custom transport (socket link / stream link).
This is typically exposed as an API-compatible proxy (query/mutation terminals) so callsites remain ergonomic.

### 4) Single surface composition
The OneJS app composes a single `caller` that includes:
- `sigil: localTrpc` (local core/game)
- `seer/evolution/forge: remoteTrpc` (remote namespaces)

## Public API / “How to use”
### Create the app runtime
- `createApp()` returns `{ app, router, ctx, caller, detachTrpc }` (shape may vary).
- `caller` is the main surface used by gameplay/app modules.

Example call patterns:
- Local: `caller.sigil.core.onWebInitialized.mutate()`
- Remote: `caller.seer.core.getTrades.query(input)`
- Remote: `caller.forge.core.showLogin.mutate()`

### Stream-driven local dispatch
When Unity emits `sigil.core` stream events, JS dispatches into local tRPC procedures:
- stream event name ↔ procedure name must match (or be mapped)
- payloads may be wrapped (`{ args }`) depending on zod input shape

## Important files
### Runtime entry / composition
- `sigil/app.ts`
  - builds `t`, router, ctx
  - creates local caller
  - creates remote caller
  - creates `caller` surface (local + remote)
  - binds Unity streams → local router dispatch
  - manages cleanup (`detachTrpc`)

### Unity stream bridge
- `sigil/util/unityStreamSocket.ts`
  - central dispatcher for Unity streams
  - buffering to avoid “event fired before listener registered”
  - `createUnityStreamSocket(stream)` returns `{ onAny, on, emit, destroy }`

### tRPC proxy/hooks utilities
- `sigil/util/trpcHooks.ts`
  - lightweight proxy builder for `query/mutate/mutateAsync`
  - generates hooks in Preact environments (`useMutation`)
  - used to keep callsites ergonomic without bundling @trpc/react-query

### Socket / link transport (if used in OneJS)
- `arken/packages/node/trpc/socketLink.ts` (or equivalent)
  - socket.io based TRPCLink
  - request correlation via `id`
  - callback registry for async responses
  - shared response handler via `attachTrpcResponseHandler`

## Conventions
- Prefer stable namespaces: `core`, `game`, `seer`, `evolution`, `forge`
- Stream names are explicit (`sigil.core`, `sigil.game`)
- Procedures are treated as commands/events where appropriate (fire-and-forget supported)
- Always include request IDs in errors for traceability

## Debugging checklist
- If an event “does nothing”: confirm stream listener registered + buffered replay
- If a procedure can’t be found: verify router proc names match Unity eventName
- If a call “hangs”: confirm correlation `id` and that `trpcResponse` is wired
- If type safety breaks: ensure router types are derived from actual router factories (not hand-redeclared)