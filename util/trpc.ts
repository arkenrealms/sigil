// sigil/util/trpc.ts
import { TRPCClientError, createTRPCUntypedClient } from "@trpc/client";

import {
  createSocketLink,
  attachTrpcResponseHandler,
  type BackendConfig,
  type SocketClient,
  type WaitUntilFn,
} from "./socketLink";

import type { StreamName } from "./unityStreamSocket";
import { createUnityStreamSocket } from "./unityStreamSocket";
import { createTrpcHooks } from "./trpcHooks";

// unified facade type (local + remote live under ctx.app.trpc)
export type AppTrpcCaller = any;

const waitUntil: WaitUntilFn = (predicate, timeoutMs, intervalMs = 25) => {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (predicate()) return resolve();
      if (Date.now() - start > timeoutMs) {
        console.log("waitUntil reject");
        return reject(new Error("timeout"));
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
};

function notifyTRPCError(err: any) {
  console.warn("[TRPC]", err?.message ?? err, err);
}

// ✅ only remote unity backends (exclude local sigil.* streams)
type Route = Exclude<StreamName, "sigil.core" | "sigil.game">;

const backends: BackendConfig[] = [
  { name: "seer", url: "unity" },
  { name: "evolutionShard", url: "unity" },
  { name: "evolutionRealm", url: "unity" },
  { name: "forge", url: "unity" },
];

function parseOpPath(opPath: string): { route: Route; method: string } {
  const parts = String(opPath || "")
    .split(".")
    .filter(Boolean);

  const p = parts[0] === "trpc" ? parts.slice(1) : parts;

  if (p.length < 2) {
    throw new TRPCClientError<any>(
      `Invalid tRPC path (expected "<backend>.<proc>" or "trpc.<backend>.<proc>"): ${opPath}`,
    );
  }

  const backend = p[0];
  const rest = p.slice(1);

  if (backend === "seer") {
    return { route: "seer", method: rest.join(".") };
  }

  if (backend === "forge") {
    return { route: "forge", method: rest.join(".") };
  }

  if (backend === "evolution") {
    const lane = rest[0]; // shard | realm

    if (lane === "shard")
      return { route: "evolutionShard", method: rest.join(".") };
    if (lane === "realm")
      return { route: "evolutionRealm", method: rest.join(".") };

    throw new TRPCClientError<any>(
      `Invalid evolution route (expected evolution.shard.* or evolution.realm.*): ${opPath}`,
    );
  }

  throw new TRPCClientError<any>(
    `Unknown backend '${backend}' in ${opPath} (expected seer.*, forge.*, or evolution.(shard|realm).*)`,
  );
}

export function createAppTrpcCaller(opts?: {
  logging?: boolean;
  requestTimeoutMs?: number;
}) {
  const logging = !!opts?.logging;
  const requestTimeoutMs = opts?.requestTimeoutMs ?? 15_000;

  const streamSockets: Partial<
    Record<Route, ReturnType<typeof createUnityStreamSocket>>
  > = {};
  const clients: Record<string, SocketClient> = {};

  for (const b of backends) {
    const route = b.name as Route;

    const sock =
      streamSockets[route] ??
      (streamSockets[route] = createUnityStreamSocket(route, clients));

    const client: SocketClient = {
      ioCallbacks: {},
      socket: {
        emit: (event: string, payload: any) => sock.emit(event, payload),
        on: (event: string, cb: (payload: any) => void) => sock.on?.(event, cb),
        off: (event: string, cb: (payload: any) => void) =>
          sock.off?.(event, cb),
        onAny: (cb: (event: string, payload: any) => void) => sock.onAny(cb),
        offAny: (cb: (event: string, payload: any) => void) => sock.offAny(cb),
      } as any,
    };

    attachTrpcResponseHandler({
      client,
      backendName: route,
      logging,
      preferOnAny: true,
      onServerPush: ({ method, params }) => {
        if (logging) console.info(`[${route}] push`, method, params);
      },
    });

    clients[route] = client;
  }

  const baseLink = createSocketLink({
    backends,
    clients,
    waitUntil,
    notifyTRPCError,
    requestTimeoutMs,
  });

  const routedLink = (runtime: any) => {
    const inner = baseLink(runtime);

    return (ctx: any) => {
      try {
        const { op, next } = ctx;
        const { route, method } = parseOpPath(op.path);
        const rewrittenOp = { ...op, path: `${route}.${method}` };

        if (logging) {
          console.info(
            "[trpc] op",
            JSON.stringify({
              original: op.path,
              rewritten: rewrittenOp.path,
              type: op.type,
              input: op.input,
            }),
          );
        }

        return inner({ op: rewrittenOp, next });
      } catch (e) {
        console.log("routedLink baseLink error", e);
        throw e;
      }
    };
  };

  const baseClient = createTRPCUntypedClient({
    links: [routedLink],
  });

  // ✅ Hooks facade that talks to baseClient via string paths
  const hooks = createTrpcHooks(
    {
      query: (path, input) => baseClient.query(path, input as any),
      mutation: (path, input) => baseClient.mutation(path, input as any),
    },
    { logging },
  );

  return {
    hooks: hooks as AppTrpcCaller,

    clients,

    detach() {
      try {
        streamSockets.seer?.destroy?.();
      } catch {}
      try {
        streamSockets.evolutionShard?.destroy?.();
      } catch {}
      try {
        streamSockets.evolutionRealm?.destroy?.();
      } catch {}
      try {
        streamSockets.forge?.destroy?.();
      } catch {}
    },
  };
}
