// sigil/util/trpc.ts
import { createTRPCProxyClient } from "@trpc/client";

import {
  createSocketLink,
  attachTrpcResponseHandler,
  type BackendConfig,
  type SocketClient,
  type WaitUntilFn,
} from "./socketLink";

import type { AppRouter } from "../app.router";
import { createUnityEventSocket } from "./unityEventSocket";
import { createTrpcHooks } from "./trpcHooks";

const waitUntil: WaitUntilFn = (predicate, timeoutMs, intervalMs = 25) => {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (predicate()) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error("timeout"));
      setTimeout(tick, intervalMs);
    };
    tick();
  });
};

function notifyTRPCError(err: any) {
  console.warn("[TRPC]", err?.message ?? err, err);
}

const backendToUnityChannel: Record<string, "server" | "web"> = {
  seer: "server",
  evolution: "server",
  web: "web",
};

type FrontendBackendName = "seer" | "evolution" | "web";

const backends: BackendConfig[] = [
  { name: "seer" as FrontendBackendName, url: "unity" },
  { name: "evolution" as FrontendBackendName, url: "unity" },
  { name: "web" as FrontendBackendName, url: "unity" },
];

const logging = false;

const socketsByChannel: Partial<
  Record<"server" | "web", ReturnType<typeof createUnityEventSocket>>
> = {};

export const clients: Record<string, SocketClient> = {};

for (const b of backends) {
  const unityChannel = backendToUnityChannel[b.name] ?? "server";

  const sock =
    socketsByChannel[unityChannel] ??
    (socketsByChannel[unityChannel] = createUnityEventSocket(unityChannel));

  const client: SocketClient = {
    ioCallbacks: {},
    socket: {
      emit: (event: string, payload: any) => sock.emit(event, payload),
      on: (event: string, cb: (payload: any) => void) => sock.on?.(event, cb),
      off: (event: string, cb: (payload: any) => void) => sock.off?.(event, cb),
      onAny: (cb: (event: string, payload: any) => void) => sock.onAny(cb),
      offAny: (cb: (event: string, payload: any) => void) => sock.offAny(cb),
    } as any,
  };

  attachTrpcResponseHandler({
    client,
    backendName: b.name,
    logging,
    preferOnAny: true,
    onServerPush: ({ method, params }) => {
      if (logging) console.info(`[${b.name}] server push`, method, params);
    },
  });

  clients[b.name] = client;
}

const combinedLink = createSocketLink({
  backends,
  clients,
  waitUntil,
  notifyTRPCError,
  requestTimeoutMs: 15_000,
});

// ✅ Raw proxy client (NO react-query / NO Provider)
export const trpcRaw = createTRPCProxyClient<AppRouter>({
  links: [combinedLink],
});

// ✅ Preact-safe “hooks” facade: trpc.*.*.useMutation()
export const trpc = createTrpcHooks(trpcRaw);

// Optional cleanup if you hot-reload / recreate app:
export function detachUnityTrpc() {
  try {
    socketsByChannel.server?.destroy?.();
  } catch (e) {
    console.log("ERR21", e);
  }
  try {
    socketsByChannel.web?.destroy?.();
  } catch (e) {
    console.log("ERR22", e);
  }
}
