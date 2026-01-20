// sigil/util/trpcCaller.ts
//
import { createTRPCProxyClient } from "@trpc/client";
import {
  createSocketLink,
  type BackendConfig,
  type SocketClient,
  type WaitUntilFn,
} from "./socketLink";
import { attachTrpcResponseHandler } from "./socketLink";
import { createUnityEventSocket } from "./unityEventSocket";

type BackendName = "seer" | "evolution" | "web";

/**
 * This is the unified caller type your services consume.
 * (You can replace `any` with your real AppRouter type later.)
 */
export type AppTrpcCaller = any;

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

/**
 * Map each backend to a Unity “channel”.
 * - server: native/network events
 * - web: webview / auth events
 *
 * You can freely re-route later without touching call sites.
 */
const backendToChannel: Record<BackendName, "server" | "web"> = {
  seer: "server",
  evolution: "server",
  web: "web",
};

export function createAppTrpcCaller(opts?: {
  logging?: boolean;
  requestTimeoutMs?: number;
}) {
  const logging = !!opts?.logging;
  const requestTimeoutMs = opts?.requestTimeoutMs ?? 15_000;

  const backends: BackendConfig[] = [
    { name: "seer", url: "unity" },
    { name: "evolution", url: "unity" },
    { name: "web", url: "unity" },
  ];

  // One Unity socket per channel (shared)
  const socketsByChannel: Partial<
    Record<"server" | "web", ReturnType<typeof createUnityEventSocket>>
  > = {};

  const clients: Record<string, SocketClient> = {};

  for (const b of backends) {
    const backend = b.name as BackendName;
    const channel = backendToChannel[backend];

    const sock =
      socketsByChannel[channel] ??
      (socketsByChannel[channel] = createUnityEventSocket(channel));

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
      backendName: backend,
      logging,
      preferOnAny: true,
      onServerPush: ({ method, params }) => {
        // Optional: route server pushes into stores here
        if (logging) console.info(`[${backend}] push`, method, params);
      },
    });

    clients[backend] = client;
  }

  const link = createSocketLink({
    backends,
    clients,
    waitUntil,
    notifyTRPCError,
    requestTimeoutMs,
  });

  const trpc = createTRPCProxyClient<any>({
    links: [link],
  });

  return {
    trpc: trpc as AppTrpcCaller,
    clients,
    socketsByChannel,
    detach() {
      try {
        socketsByChannel.server?.destroy?.();
      } catch {}
      try {
        socketsByChannel.web?.destroy?.();
      } catch {}
    },
  };
}
