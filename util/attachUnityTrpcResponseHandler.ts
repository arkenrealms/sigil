// sigil/util/attachUnityTrpcResponseHandler.ts
import { serialize, deserialize } from "./rpc";
import type { EventClient } from "./eventLink";

export interface AttachUnityTrpcResponseHandlerOptions {
  client: EventClient;
  logging?: boolean;

  /**
   * Unity event name carrying tRPC responses.
   * Default "trpcResponse"
   */
  responseEventName?: string;

  /**
   * If true, uses socket.onAny/offAny (we support only onAny on our unity socket)
   */
  preferOnAny?: boolean;

  /**
   * If your response correlates with oid instead of id
   */
  responseIdField?: "id" | "oid" | string;
}

/**
 * Resolves outstanding client.ioCallbacks[uuid] when Unity emits `trpcResponse`.
 *
 * Expected response payload shape:
 *   { id, result, error?, meta? }
 *
 * Where `result` is typically serialized; we deserialize in the link, but
 * some stacks keep it serialized until here — we handle both.
 */
export function attachUnityTrpcResponseHandler(
  opts: AttachUnityTrpcResponseHandlerOptions
) {
  const {
    client,
    logging = false,
    responseEventName = "trpcResponse",
    preferOnAny = true,
    responseIdField = "id",
  } = opts;

  if (!client.ioCallbacks) client.ioCallbacks = {};

  const logInfo = (...args: any[]) =>
    logging ? console.info(...args) : void 0;
  const logWarn = (...args: any[]) =>
    logging ? console.warn(...args) : void 0;

  const handle = (eventName: string, payload: any) => {
    if (eventName !== responseEventName) return;

    try {
      const id = payload?.[responseIdField];
      const cb = id ? client.ioCallbacks[id] : null;

      if (!cb) {
        if (logging) logWarn("[UnityTRPC] no callback for", id, payload);
        return;
      }

      clearTimeout(cb.timeout);

      // If the response contains a "result" that is still serialized, try to deserialize.
      // (Your socketLink example deserializes in the link; but this makes it robust.)
      if (payload?.result && typeof payload.result === "string") {
        try {
          payload.result = deserialize(payload.result);
        } catch {
          // ignore
        }
      }

      cb.resolve(payload);
      delete client.ioCallbacks[id];

      if (logging) logInfo("[UnityTRPC] resolved", id, payload);
    } catch (e) {
      console.error("[UnityTRPC] handler error", e, payload);
    }
  };

  // We only support onAny on our unity socket; keep preferOnAny default true.
  if (preferOnAny && typeof client.socket.onAny === "function") {
    const anyHandler = (eventName: string, payload: any) =>
      handle(eventName, payload);
    client.socket.onAny(anyHandler);

    return () => {
      if (typeof client.socket.offAny === "function")
        client.socket.offAny(anyHandler);
    };
  }

  // Fallback if you later add on/off for specific events
  const onHandler = (payload: any) => handle(responseEventName, payload);
  if (typeof (client.socket as any).on === "function") {
    (client.socket as any).on(responseEventName, onHandler);
  }

  return () => {
    if (typeof (client.socket as any).off === "function") {
      (client.socket as any).off(responseEventName, onHandler);
    }
  };
}
