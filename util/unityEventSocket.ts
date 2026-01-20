// sigil/util/unityEventSocket.ts
import { unityEmit } from "./unityEmit";

declare const CS: any;

export type UnityEventChannel = "server" | "web";

/**
 * Minimal "event socket" facade used by the tRPC eventLink + response handler.
 *
 * - Outbound requests go through Bridge.Emit(...)
 * - Inbound responses are delivered by Bridge.OnServerEvent / Bridge.OnWebEvent
 *
 * We provide:
 *  - emit(eventName, payload)
 *  - onAny(cb) / offAny(cb)  (generic; no need to keep adding events)
 *  - on/off (per-event convenience)
 */
export function createUnityEventSocket(channel: UnityEventChannel) {
  const bridge = CS?.Arken?.Bridge?.Instance;
  if (!bridge) throw new Error("[unityEventSocket] Bridge.Instance missing");

  const listeners = new Set<(eventName: string, payload: any) => void>();

  const handler = (eventName: string, args: string) => {
    let payload: any = args;

    // Try parse JSON (Unity args are almost always JSON strings)
    try {
      payload = args ? JSON.parse(args) : args;
    } catch {
      // keep raw string if not JSON
      payload = args;
    }

    for (const l of listeners) {
      try {
        l(eventName, payload);
      } catch (e) {
        console.warn("[unityEventSocket] listener error", e);
      }
    }
  };

  // ✅ CRITICAL: bind the receiver so Puerts has a target ("this")
  const add =
    channel === "server"
      ? bridge.add_OnServerEvent?.bind(bridge)
      : bridge.add_OnWebEvent?.bind(bridge);

  const remove =
    channel === "server"
      ? bridge.remove_OnServerEvent?.bind(bridge)
      : bridge.remove_OnWebEvent?.bind(bridge);

  if (typeof add !== "function" || typeof remove !== "function") {
    throw new Error(
      `[unityEventSocket] Bridge missing add/remove for channel=${channel}`,
    );
  }

  add(handler);

  // Map per-event listeners -> underlying onAny listener
  const perEvent = new Map<
    string,
    Map<(payload: any) => void, (eventName: string, payload: any) => void>
  >();

  return {
    emit: (eventName: string, payload: any) => {
      // payload should already be a plain object; unityEmit will JSON.stringify it.
      unityEmit(eventName, payload);
    },

    onAny: (cb: (eventName: string, payload: any) => void) => {
      listeners.add(cb);
    },

    offAny: (cb: (eventName: string, payload: any) => void) => {
      listeners.delete(cb);
    },

    on: (eventName: string, cb: (payload: any) => void) => {
      let cbs = perEvent.get(eventName);
      if (!cbs) {
        cbs = new Map();
        perEvent.set(eventName, cbs);
      }

      // Avoid double-registering same cb
      if (cbs.has(cb)) return;

      const wrapper = (name: string, payload: any) => {
        if (name === eventName) cb(payload);
      };

      cbs.set(cb, wrapper);
      listeners.add(wrapper);
    },

    off: (eventName: string, cb: (payload: any) => void) => {
      const cbs = perEvent.get(eventName);
      const wrapper = cbs?.get(cb);
      if (!wrapper) return;

      listeners.delete(wrapper);
      cbs!.delete(cb);
      if (cbs!.size === 0) perEvent.delete(eventName);
    },

    destroy: () => {
      try {
        remove(handler);
      } catch {}
      listeners.clear();
      perEvent.clear();
    },
  };
}
