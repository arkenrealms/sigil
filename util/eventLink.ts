// sigil/util/eventLink.ts
import { TRPCClientError, type TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { generateShortId } from "./db";
import { serialize, deserialize } from "./rpc";

export type EventClient = {
  ioCallbacks: Record<
    string,
    {
      timeout: any;
      resolve: (payload: any) => void;
      reject: (err: any) => void;
      request?: any;
    }
  >;

  socket: {
    emit: (event: string, payload: any) => void;
    onAny?: (cb: (eventName: string, payload: any) => void) => void;
    offAny?: (cb: (eventName: string, payload: any) => void) => void;
  };
};

export type WaitUntilFn = (
  predicate: () => boolean,
  timeoutMs: number,
  intervalMs?: number,
) => Promise<void>;

export type NotifyTRPCErrorFn = (err: any) => void;

export interface CreateEventLinkOptions {
  client: EventClient;
  notifyTRPCError: NotifyTRPCErrorFn;
  waitUntil: WaitUntilFn;

  /**
   * Unity event name to send request envelopes over.
   * Default "trpc"
   */
  requestEventName?: string;

  /**
   * Unity event name for responses.
   * Default "trpcResponse"
   */
  responseEventName?: string;

  requestTimeoutMs?: number;
}

/**
 * tRPC link that sends requests over Unity's event emitter.
 *
 * IMPORTANT:
 * - It strips the first router segment from op.path.
 *   Example: "shard.login" => method "login"
 *
 * Unity receives payload:
 *   { id, method, type, params }
 *
 * Unity responds via event `trpcResponse` with:
 *   { id, result, error? }
 */
export function createEventLink(
  options: CreateEventLinkOptions,
): TRPCLink<any> {
  const {
    client,
    notifyTRPCError,
    waitUntil,
    requestEventName = "trpc",
    responseEventName = "trpcResponse",
    requestTimeoutMs = 15_000,
  } = options;

  return () =>
    ({ op }) =>
      observable((observer) => {
        const uuid = generateShortId();

        const run = async () => {
          try {
            // ensure socket exists
            await waitUntil(() => !!client?.socket?.emit, 60_000);
          } catch {
            const err = new TRPCClientError<any>("[UnityTRPC] socket timeout");
            notifyTRPCError(err);
            observer.error(err);
            observer.complete();
            return;
          }

          const routes = op.path.split(".");
          const method = routes[routes.length - 1]; // TODO: wont be sufficient.

          const request = {
            id: uuid,
            method,
            type: op.type, // 'query' | 'mutation' | 'subscription'
            params: serialize(op.input),
          };

          client.ioCallbacks[uuid] = client.ioCallbacks[uuid] || ({} as any);
          client.ioCallbacks[uuid].request = request;

          // emit request envelope (Unity will forward to server / native)
          client.socket.emit(requestEventName, request);

          const timeout = setTimeout(() => {
            const err = new TRPCClientError<any>("[UnityTRPC] request timeout");
            if (client.ioCallbacks[uuid]) delete client.ioCallbacks[uuid];
            notifyTRPCError(err);
            observer.error(err);
          }, requestTimeoutMs);

          client.ioCallbacks[uuid] = {
            timeout,
            resolve: (pack: any) => {
              clearTimeout(timeout);

              if (pack?.error) {
                const baseErr =
                  pack.error instanceof TRPCClientError
                    ? pack.error
                    : new TRPCClientError<any>(
                        typeof pack.error === "string"
                          ? pack.error
                          : JSON.stringify(pack.error),
                      );

                (baseErr as any).data = {
                  ...((baseErr as any).data || {}),
                  reqId: pack.id ?? uuid,
                };

                notifyTRPCError(baseErr);
                observer.error(baseErr as any);
                delete client.ioCallbacks[uuid];
                return;
              }

              // normalize result
              // Your server style uses { status: 1, data: ... }
              let result: any = pack?.result;

              // If still serialized, deserialize
              if (typeof result === "string") {
                try {
                  result = deserialize(result);
                } catch {
                  // ignore, keep raw
                }
              }

              // If you wrap with status/data, unwrap like your socketLink did
              if (result && typeof result === "object" && "status" in result) {
                if (result.status !== 1) {
                  const statusErr = new TRPCClientError<any>(
                    `[UnityTRPC] status error ${JSON.stringify(result)}`,
                  );
                  (statusErr as any).data = {
                    ...((statusErr as any).data || {}),
                    reqId: pack.id ?? uuid,
                  };
                  notifyTRPCError(statusErr);
                  observer.error(statusErr as any);
                  delete client.ioCallbacks[uuid];
                  return;
                }

                observer.next({
                  result: { data: result.data ?? result },
                } as any);
                observer.complete();
                delete client.ioCallbacks[uuid];
                return;
              }

              // raw tRPC-ish result
              observer.next({ result } as any);
              observer.complete();
              delete client.ioCallbacks[uuid];
            },

            reject: (error: any) => {
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
