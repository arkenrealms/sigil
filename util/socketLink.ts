// arken/packages/node/trpc/socketLink.ts
//
import {
  TRPCClientError,
  type TRPCLink,
  createTRPCProxyClient,
} from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { serialize, deserialize } from "./rpc";
import { generateShortId } from "./db";

// ======================
// Types
// ======================

export type BackendConfig = {
  name: string;
  url: string;
};

export type SocketClient = {
  ioCallbacks: Record<string, any>;
  socket: {
    emit: (...args: any[]) => void;
    on?: (event: string, cb: (payload: any) => void) => void;
    onAny?: (cb: (eventName: string, payload: any) => void) => void;
    off?: (event: string, cb: (payload: any) => void) => void;
    offAny?: (cb: (eventName: string, payload: any) => void) => void;
    [key: string]: any;
  };
};

export type WaitUntilFn = (
  predicate: () => boolean,
  timeoutMs: number,
  intervalMs?: number,
) => Promise<void>;
export type NotifyTRPCErrorFn = (err: any) => void;

export interface CreateSocketLinkOptions {
  backends: BackendConfig[];
  clients: Record<string, SocketClient>;
  notifyTRPCError: NotifyTRPCErrorFn;
  waitUntil: WaitUntilFn;
  requestTimeoutMs?: number;
}

export interface AttachTrpcResponseHandlerOptions {
  client: SocketClient;
  backendName: string;
  logging?: boolean;

  /**
   * If your server responds with { oid: <original-id> } instead of { id: <id> },
   * set this to "oid". Default is "id".
   */
  responseIdField?: "id" | "oid" | string;

  /**
   * If true, prefer socket.onAny(...) if available. (Useful where responses
   * come in via onAny and not a dedicated event handler.)
   */
  preferOnAny?: boolean;

  onServerPush?: (msg: { id: string; method: string; params: any }) => void;
}

export interface CreateSocketProxyClientOptions<TRouter = any> {
  client: SocketClient;
  logPrefix?: string;
  roles?: string[];
  requestTimeoutMs?: number;
}

// ======================
// createSocketLink
// ======================

/**
 * Socket.IO-based TRPC link, similar to your React combinedLink, but extracted.
 */
export function createSocketLink(
  options: CreateSocketLinkOptions,
): TRPCLink<any> {
  const {
    backends,
    clients,
    notifyTRPCError,
    waitUntil,
    requestTimeoutMs = 60_000,
  } = options;

  const backendNames = new Set(backends.map((b) => b.name));

  return () =>
    ({ op }) =>
      observable((observer) => {
        const [routerName] = op.path.split(".");

        if (!routerName || !backendNames.has(routerName)) {
          console.log(`Unknown router for ${op.path}`);
          const err = new TRPCClientError<any>(`Unknown router for ${op.path}`);
          notifyTRPCError(err);
          observer.error(err);
          observer.complete();
          return;
        }

        const client = clients[routerName];
        const uuid = generateShortId();

        const run = async () => {
          // 1) Wait for socket connection
          try {
            await waitUntil(() => !!client?.socket?.emit, 60_000);
          } catch {
            console.log("Socket connection timeout");
            const err = new TRPCClientError<any>("Socket connection timeout");
            notifyTRPCError(err);
            observer.error(err);
            observer.complete();
            return;
          }

          const { input } = op;

          const routes = op.path.split(".");
          const method =
            routerName === "forge"
              ? routes.join(".")
              : routerName === "seer"
                ? routes.slice(1).join(".")
                : routes[routes.length - 1]; // TODO: wont be sufficient.

          // 2) Emit the request
          client.socket.emit("trpc", {
            id: uuid,
            method: method,
            type: op.type,
            params: input, // serialize(input),
          });

          // 3) Timeout handling
          const timeout = setTimeout(() => {
            console.log(
              `Request timeout: ${uuid} ${method} ${op.type} ${JSON.stringify(input)}`,
            );
            const err = new TRPCClientError<any>(
              `Request timeout: ${uuid} ${method} ${op.type} ${JSON.stringify(input)}`,
            );
            if (client.ioCallbacks[uuid]) delete client.ioCallbacks[uuid];
            notifyTRPCError(err);
            observer.error(err);
          }, requestTimeoutMs);

          // 4) Register callbacks for response
          client.ioCallbacks[uuid] = {
            timeout,
            resolve: (response: any) => {
              console.log("createSocketLink ioCallbacks resolve");
              clearTimeout(timeout);

              if (response.error) {
                console.log("createSocketLink ioCallbacks resolve error");
                // Build a TRPCClientError from the raw error
                const baseErr =
                  response.error instanceof TRPCClientError
                    ? response.error
                    : new TRPCClientError<any>(
                        typeof response.error === "string"
                          ? response.error
                          : JSON.stringify(response.error),
                      );

                // Attach request id onto error data
                const errAny = baseErr as any;
                errAny.data = {
                  ...(errAny.data || {}),
                  reqId: response.id ?? uuid,
                };

                notifyTRPCError(baseErr);
                observer.error(baseErr as any);
              } else {
                const result: any = deserialize(response.result);

                console.log(
                  "createSocketLink ioCallbacks no error",
                  JSON.stringify(response.result),
                  JSON.stringify(result),
                );

                observer.next({
                  result: {
                    status: result?.status ?? 1,
                    data: result?.data ?? result,
                  },
                } as any);
                observer.complete();
              }

              delete client.ioCallbacks[uuid];
            },

            reject: (error: any) => {
              console.log("createSocketLink ioCallbacks reject");
              clearTimeout(timeout);

              let err: any = error;
              if (!(error instanceof TRPCClientError)) {
                err =
                  typeof error === "string"
                    ? new TRPCClientError<any>(error)
                    : new TRPCClientError<any>(JSON.stringify(error));
              }

              err.data = {
                ...(err.data || {}),
                reqId: uuid,
              };

              notifyTRPCError(err);
              observer.error(err as any);
              delete client.ioCallbacks[uuid];
            },
          };
        };

        run();

        // teardown
        return () => {
          if (client.ioCallbacks[uuid]) {
            clearTimeout(client.ioCallbacks[uuid].timeout);
            delete client.ioCallbacks[uuid];
          }
        };
      });
}

// ======================
// attachTrpcResponseHandler
// ======================

/**
 * Attach a shared handler that resolves ioCallbacks for "trpcResponse"
 * AND forwards "trpc" (no id) as server-push / commands.
 *
 * Supports either:
 *  - socket.on('trpcResponse', ...)
 *  - socket.onAny((eventName, payload) => ...)
 */
export function attachTrpcResponseHandler(
  opts: AttachTrpcResponseHandlerOptions,
) {
  const {
    client,
    backendName,
    logging = true,
    onServerPush,
    responseIdField = "id",
    preferOnAny = false,
  } = opts;

  if (!client.ioCallbacks) client.ioCallbacks = {};

  const logInfo = (...args: any[]) =>
    logging ? console.info(...args) : undefined;
  const logWarn = (...args: any[]) =>
    logging ? console.warn(...args) : undefined;

  const handlePayload = (eventName: string, payload: any) => {
    try {
      if (logging)
        logInfo(`[${backendName} Socket] Event:`, eventName, payload);

      // -----------------------
      // 1) Normal response path
      // -----------------------
      if (eventName === "trpcResponse") {
        const id = payload?.[responseIdField];
        const cb = id ? client.ioCallbacks[id] : undefined;

        if (cb) {
          if (logging)
            logInfo(
              `[${backendName} Socket] Callback exists for ID:`,
              id,
              payload,
            );

          clearTimeout(cb.timeout);

          try {
            cb.resolve(payload);
          } catch (e) {
            if (logging) logInfo(`[${backendName} Socket] Callback error:`, e);
            cb.reject(e);
          }

          delete client.ioCallbacks[id];
        } else if (logging) {
          logWarn(`[${backendName} Socket] No callback found for ID: ${id}`);
        }

        return;
      }

      // -----------------------
      // 2) Server-push / commands
      // -----------------------
      // Forge/webview can send "trpc" frames that are NOT correlated to a request.
      // We treat them as push instructions.
      if (eventName === "trpc") {
        if (onServerPush) {
          const { method, params } = payload ?? {};
          onServerPush({
            id: payload?.[responseIdField], // might be absent; okay
            method,
            params: params ? deserialize(params) : undefined,
          });
        }
        return;
      }

      // Everything else: ignore (or you could forward elsewhere)
    } catch (e) {
      console.error(`[${backendName} Socket] Error in handler:`, e);
    }
  };

  // Prefer onAny if requested and available
  if (preferOnAny && typeof client.socket.onAny === "function") {
    const anyHandler = (eventName: string, payload: any) => {
      // IMPORTANT: allow BOTH "trpcResponse" (responses) and "trpc" (push)
      if (eventName !== "trpcResponse" && eventName !== "trpc") return;
      handlePayload(eventName, payload);
    };

    client.socket.onAny(anyHandler);
    return () => {
      if (typeof client.socket.offAny === "function")
        client.socket.offAny(anyHandler);
    };
  }

  // Dedicated listeners
  const onTrpcHandler = (res: any) => handlePayload("trpc", res);
  const onTrpcResponseHandler = (res: any) =>
    handlePayload("trpcResponse", res);

  client.socket.on("trpc", onTrpcHandler);
  client.socket.on("trpcResponse", onTrpcResponseHandler);

  return () => {
    client.socket.off("trpc", onTrpcHandler);
    client.socket.off("trpcResponse", onTrpcResponseHandler);
  };
}

// ======================
// createSocketProxyClient
// ======================

/**
 * Small helper to build a tRPC proxy over a single SocketClient, reusing the same
 * callback / timeout / serialization pattern. Useful for "peer" connections.
 *
 * We return `any` here to dodge the super strict `InferrableClientTypes` generics
 * from @trpc/client; you can cast at the call site if you want stronger typing.
 */
export function createSocketProxyClient<TRouter = any>(
  opts: CreateSocketProxyClientOptions<TRouter>,
): any {
  const {
    client,
    logPrefix = "SocketProxy",
    roles = [],
    requestTimeoutMs = 60_000,
  } = opts;

  const proxy = createTRPCProxyClient<any>({
    links: [
      () =>
        ({ op }) =>
          observable((observer) => {
            try {
              const { input } = op;

              // Attach client + roles to context if someone uses it
              (op as any).context = (op as any).context ?? {};
              (op as any).context.client = client;
              (op as any).context.client.roles = roles;

              if (!client?.socket?.emit) {
                observer.error(
                  new TRPCClientError<any>(
                    `${logPrefix}: Emit Direct failed, no client or bad socket`,
                  ) as any,
                );
                observer.complete();
                return;
              }

              const uuid = generateShortId();

              const [routerName] = op.path.split(".");
              const method = routerName
                ? op.path.replace(`${routerName}.`, "")
                : op.path;

              const request = {
                id: uuid,
                method,
                type: op.type,
                params: input, // serialize(input),
              };
              client.ioCallbacks[uuid] = client.ioCallbacks[uuid] || {};
              client.ioCallbacks[uuid].request = request;

              const timeout = setTimeout(() => {
                delete client.ioCallbacks[uuid];
                observer.error(
                  new TRPCClientError<any>(
                    `${logPrefix}: Request timeout ${uuid} ${method} ${op.type} ${JSON.stringify(input)}`,
                  ) as any,
                );
              }, requestTimeoutMs);

              client.ioCallbacks[uuid] = {
                ...(client.ioCallbacks[uuid] || {}),
                timeout,
                resolve: (pack: any) => {
                  console.log("createSocketProxyClient resolve");

                  clearTimeout(timeout);

                  if (pack.error) {
                    const baseErr =
                      pack.error instanceof TRPCClientError
                        ? (pack.error as any)
                        : (new TRPCClientError<any>(
                            typeof pack.error === "string"
                              ? pack.error
                              : JSON.stringify(pack.error),
                          ) as any);

                    (baseErr as any).data = {
                      ...((baseErr as any).data || {}),
                      reqId: pack.id ?? uuid,
                    };

                    observer.error(baseErr);
                  } else {
                    const result: any = deserialize(pack.result);
                    console.log("vvvvvvv", pack.result, result?.status === 1);
                    if (result?.status !== 1) {
                      const statusErr = new TRPCClientError<any>(
                        `${logPrefix}: status error ${JSON.stringify(result)}`,
                      ) as any;
                      statusErr.data = {
                        ...(statusErr.data || {}),
                        reqId: pack.id ?? uuid,
                      };
                      observer.error(statusErr);
                    } else {
                      observer.next({
                        result: {
                          status: result?.status ?? 1,
                          data: result?.data ?? result,
                        },
                      } as any);
                      observer.complete();
                    }
                  }

                  delete client.ioCallbacks[uuid];
                },
                reject: (error: any) => {
                  console.log("createSocketProxyClient reject");
                  clearTimeout(timeout);

                  let err: any = error;
                  if (!(error instanceof TRPCClientError)) {
                    err =
                      typeof error === "string"
                        ? new TRPCClientError<any>(error)
                        : new TRPCClientError<any>(JSON.stringify(error));
                  }

                  err.data = {
                    ...(err.data || {}),
                    reqId: uuid,
                  };

                  observer.error(err as any);
                  delete client.ioCallbacks[uuid];
                },
              };

              client.socket.emit("trpc", request);
            } catch (e) {
              console.log("createSocketProxyClient error", e);
            }
          }),
    ],
  });

  return proxy;
}

// ======================
// bindSocketClientEmit (server-side convenience)
// ======================

export interface BindSocketClientEmitOptions<TRouter = any> {
  /**
   * Your per-socket client object (must have ioCallbacks + socket)
   */
  client: SocketClient;

  /**
   * The actual Socket.IO socket instance for this connection.
   */
  socket: any;

  /**
   * Just for logs
   */
  backendName?: string;

  logPrefix?: string;
  roles?: string[];
  requestTimeoutMs?: number;
  logging?: boolean;

  /**
   * If you need legacy correlation fields (e.g. oid), set this.
   */
  responseIdField?: "id" | "oid" | string;

  /**
   * If true, use socket.onAny for trpcResponse instead of socket.on('trpcResponse').
   */
  preferOnAny?: boolean;

  onServerPush?: (msg: { method: string; params: any }) => void;
}

/**
 * One-liner to:
 *  - attach the shared trpcResponse handler
 *  - build client.emit proxy using createSocketProxyClient
 *
 * Intended for SERVER-SIDE sockets (io.on('connection', socket => ...)).
 */
export function bindSocketClientEmit<TRouter = any>(
  opts: BindSocketClientEmitOptions<TRouter>,
) {
  const {
    client,
    socket,
    backendName = "socket-client",
    logPrefix = "SocketClient",
    roles = [],
    requestTimeoutMs = 15_000,
    logging = true,
    responseIdField = "id",
    preferOnAny = false,
    onServerPush,
  } = opts;

  client.ioCallbacks = client.ioCallbacks || {};
  client.socket = socket;

  // Attach shared resolver for trpcResponse
  attachTrpcResponseHandler({
    client,
    backendName,
    logging,
    responseIdField,
    preferOnAny,
    onServerPush,
  });

  // Create proxy for emitting "trpc" to the remote side
  const emit = createSocketProxyClient<TRouter>({
    client,
    logPrefix,
    roles,
    requestTimeoutMs,
  });

  return emit;
}
