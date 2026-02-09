// sigil/util/unityStreamSocket.ts
declare const CS: any;

export type StreamName =
  | "seer"
  | "evolutionShard"
  | "evolutionRealm"
  | "forge"
  | "sigil.core"
  | "sigil.game";

type AnyListener = (eventName: string, payload: any) => void;

type BufferedEvent = { eventName: string; payload: any };

type Dispatcher = {
  refCount: number;
  attached: boolean;

  perStream: Map<StreamName, Set<AnyListener>>;
  perStreamPerEvent: Map<
    StreamName,
    Map<string, Map<(payload: any) => void, AnyListener>>
  >;

  // ✅ buffer to avoid “event fired before JS listener registered”
  buffer: Map<StreamName, BufferedEvent[]>;
  bufferLimit: number;

  attach: () => void;
  detach: () => void;
};

let dispatcher: Dispatcher | null = null;

function getBridge() {
  const bridge = CS?.Arken?.Bridge?.Instance;
  if (!bridge) throw new Error("[unityStreamSocket] Bridge.Instance missing");
  return bridge;
}

function safeJsonParseArgs(args: any) {
  if (typeof args !== "string") return args;
  try {
    // "1" becomes number 1, "[]" becomes [], "{}" becomes {}
    return args ? JSON.parse(args) : args;
  } catch {
    // non-json strings fall back to raw
    return args;
  }
}

function pushBuffered(d: Dispatcher, stream: StreamName, evt: BufferedEvent) {
  let arr = d.buffer.get(stream);
  if (!arr) {
    arr = [];
    d.buffer.set(stream, arr);
  }
  arr.push(evt);
  if (arr.length > d.bufferLimit) arr.splice(0, arr.length - d.bufferLimit);
}

function replayBuffered(d: Dispatcher, stream: StreamName, cb: AnyListener) {
  const arr = d.buffer.get(stream);
  if (!arr || arr.length === 0) return;

  // Replay in order; don’t clear by default (other listeners might register too)
  for (const evt of arr) {
    try {
      const r = (cb as any)(evt.eventName, evt.payload);
      if (r && typeof (r as any).then === "function") {
        (r as Promise<any>).catch((e) => {
          console.warn(
            "[unityStreamSocket] listener error (replay)",
            { stream, eventName: evt.eventName },
            e,
          );
        });
      }
    } catch (e) {
      console.warn(
        "[unityStreamSocket] listener error (replay sync)",
        { stream, eventName: evt.eventName },
        e,
      );
    }
  }
}

function ensureDispatcher(clients: any): Dispatcher {
  if (dispatcher) return dispatcher;

  const bridge = getBridge();

  const perStream = new Map<StreamName, Set<AnyListener>>();
  const perStreamPerEvent = new Map<
    StreamName,
    Map<string, Map<(payload: any) => void, AnyListener>>
  >();

  const streamEventHandler = (
    streamName: string,
    eventName: string,
    args: any,
  ) => {
    if (!["onUpdatePlayer", "onSpawnPowerUp"].includes(eventName))
      console.log("[sigil] OnStreamEvent", streamName, eventName, args);

    if (eventName === "trpcResponse") {
      const client = clients[streamName];
      // console.log(client.ioCallbacks?.[payload.id]?.())

      const pack = typeof args === "string" ? JSON.parse(args) : args;
      const { id } = pack;

      if (pack.error) {
        console.log(
          "Local stream client callback - error occurred",
          pack,
          client.ioCallbacks[id] ? client.ioCallbacks[id].request : "",
        );
        return;
      }

      // console.log("aaaaaa", id, client.ioCallbacks[id]);

      try {
        if (client.ioCallbacks[id]) {
          clearTimeout(client.ioCallbacks[id].timeout);
          client.ioCallbacks[id].resolve(pack);
          delete client.ioCallbacks[id];
        }
      } catch (e) {
        console.log("Local stream client trpcResponse error", id, e);
      }

      return;
    }

    const stream = streamName as StreamName;
    const payload = safeJsonParseArgs(args);

    // ✅ Always buffer (fixes startup race)
    if (dispatcher) {
      pushBuffered(dispatcher, stream, { eventName, payload });
    }

    const listeners = perStream.get(stream);
    if (!listeners || listeners.size === 0) return;

    for (const l of listeners) {
      try {
        const r = (l as any)(eventName, payload);

        // ✅ If listener is async, surface errors instead of silently losing them
        if (r && typeof (r as any).then === "function") {
          (r as Promise<any>).catch((e) => {
            console.warn(
              "[unityStreamSocket] listener error (async)",
              JSON.stringify({ stream, eventName, payload }),
              e,
            );
          });
        }
      } catch (e) {
        console.warn(
          "[unityStreamSocket] listener error (sync)",
          { stream, eventName },
          e,
        );
      }
    }
  };

  // const InteractionEventHandler = (
  //   streamName: string,
  //   eventName: string,
  //   args: any,
  // ) => {
  //   if (!["onUpdatePlayer", "onSpawnPowerUp"].includes(eventName))
  //     console.log("[sigil] OnStreamEvent", streamName, eventName, args);

  //   const stream = streamName as StreamName;
  //   const payload = safeJsonParseArgs(args);

  //   // ✅ Always buffer (fixes startup race)
  //   if (dispatcher) {
  //     pushBuffered(dispatcher, stream, { eventName, payload });
  //   }

  //   const listeners = perStream.get(stream);
  //   if (!listeners || listeners.size === 0) return;

  //   for (const l of listeners) {
  //     try {
  //       const r = (l as any)(eventName, payload);

  //       // ✅ If listener is async, surface errors instead of silently losing them
  //       if (r && typeof (r as any).then === "function") {
  //         (r as Promise<any>).catch((e) => {
  //           console.warn(
  //             "[unityStreamSocket] listener error (async)",
  //             JSON.stringify({ stream, eventName, payload }),
  //             e,
  //           );
  //         });
  //       }
  //     } catch (e) {
  //       console.warn(
  //         "[unityStreamSocket] listener error (sync)",
  //         { stream, eventName },
  //         e,
  //       );
  //     }
  //   }
  // };

  const addStreamEventHandler = bridge.add_OnStreamEvent?.bind(bridge);
  const removeStreamEventHandler = bridge.remove_OnStreamEvent?.bind(bridge);

  if (
    typeof addStreamEventHandler !== "function" ||
    typeof removeStreamEventHandler !== "function"
  ) {
    throw new Error(
      "[unityStreamSocket] Bridge missing add/remove_OnStreamEvent",
    );
  }

  const addInteractionEventHandler =
    bridge.add_OnInteractionEvent?.bind(bridge);
  const removeInteractionEventHandler =
    bridge.remove_OnInteractionEvent?.bind(bridge);

  if (
    typeof addInteractionEventHandler !== "function" ||
    typeof removeInteractionEventHandler !== "function"
  ) {
    throw new Error(
      "[unityClickSocket] Bridge missing add/remove_OnInteractionEvent",
    );
  }

  dispatcher = {
    refCount: 0,
    attached: false,
    perStream,
    perStreamPerEvent,

    buffer: new Map(),
    bufferLimit: 50,

    attach: () => {
      if (dispatcher?.attached) return;
      addStreamEventHandler(streamEventHandler);
      addInteractionEventHandler(streamEventHandler);
      if (dispatcher) dispatcher.attached = true;
    },
    detach: () => {
      if (!dispatcher?.attached) return;
      removeStreamEventHandler(streamEventHandler);
      removeInteractionEventHandler(streamEventHandler);
      if (dispatcher) dispatcher.attached = false;
    },
  };

  return dispatcher!;
}

function toArgsJson(payload: any) {
  if (payload === undefined || payload === null) return "[]";
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function bridgeEmitStream(stream: StreamName, eventName: string, payload: any) {
  const bridge = getBridge();

  const s = String(stream);
  const e = String(eventName);
  const argsJson = String(toArgsJson(payload));

  // ✅ bind instance so Puerts calls correct target
  const emit = bridge.Emit?.bind(bridge);
  if (typeof emit === "function") {
    emit(
      s,
      stream === "evolutionShard" ? payload.method : e,
      stream === "evolutionShard"
        ? String(toArgsJson(payload.params))
        : argsJson,
      payload.id,
    );
    return;
  }

  throw new Error("[unityStreamSocket] Bridge.Emit missing");
}

function cleanupStreamMapsIfEmpty(d: Dispatcher, stream: StreamName) {
  const any = d.perStream.get(stream);
  const perEvent = d.perStreamPerEvent.get(stream);

  const anyEmpty = !any || any.size === 0;
  const perEventEmpty = !perEvent || perEvent.size === 0;

  if (anyEmpty) d.perStream.delete(stream);
  if (perEventEmpty) d.perStreamPerEvent.delete(stream);
}

export function createUnityStreamSocket(stream: StreamName, clients: any) {
  const d = ensureDispatcher(clients);

  d.refCount += 1;
  if (d.refCount === 1) d.attach();

  if (!d.perStream.has(stream)) d.perStream.set(stream, new Set());
  if (!d.perStreamPerEvent.has(stream))
    d.perStreamPerEvent.set(stream, new Map());

  const anyListeners = d.perStream.get(stream)!;
  const perEvent = d.perStreamPerEvent.get(stream)!;

  return {
    emit: (eventName: string, payload: any) =>
      bridgeEmitStream(stream, eventName, payload),

    onAny: (cb: AnyListener) => {
      anyListeners.add(cb);

      // ✅ REPLAY any buffered events that occurred before registration
      replayBuffered(d, stream, cb);
    },

    offAny: (cb: AnyListener) => {
      anyListeners.delete(cb);
      cleanupStreamMapsIfEmpty(d, stream);
    },

    on: (eventName: string, cb: (payload: any) => void) => {
      let mapForEvent = perEvent.get(eventName);
      if (!mapForEvent) {
        mapForEvent = new Map();
        perEvent.set(eventName, mapForEvent);
      }
      if (mapForEvent.has(cb)) return;

      const wrapper: AnyListener = (name, payload) => {
        if (name === eventName) cb(payload);
      };

      mapForEvent.set(cb, wrapper);
      anyListeners.add(wrapper);

      // ✅ Also replay buffered events for this eventName
      const arr = d.buffer.get(stream);
      if (arr && arr.length) {
        for (const evt of arr) {
          if (evt.eventName === eventName) {
            try {
              const r = (wrapper as any)(evt.eventName, evt.payload);
              if (r && typeof (r as any).then === "function") {
                (r as Promise<any>).catch((e) => {
                  console.warn(
                    "[unityStreamSocket] listener error (replay on)",
                    { stream, eventName },
                    e,
                  );
                });
              }
            } catch (e) {
              console.warn(
                "[unityStreamSocket] listener error (replay on sync)",
                { stream, eventName },
                e,
              );
            }
          }
        }
      }

      // onejs.subscribe("onReload", () => {
      //   const mapForEvent = perEvent.get(eventName);
      //   const wrapper = mapForEvent?.get(cb);
      //   if (!wrapper) return;

      //   anyListeners.delete(wrapper);
      //   mapForEvent!.delete(cb);
      //   if (mapForEvent!.size === 0) perEvent.delete(eventName);

      //   cleanupStreamMapsIfEmpty(d, stream);
      // });
    },

    off: (eventName: string, cb: (payload: any) => void) => {
      const mapForEvent = perEvent.get(eventName);
      const wrapper = mapForEvent?.get(cb);
      if (!wrapper) return;

      anyListeners.delete(wrapper);
      mapForEvent!.delete(cb);
      if (mapForEvent!.size === 0) perEvent.delete(eventName);

      cleanupStreamMapsIfEmpty(d, stream);
    },

    destroy: () => {
      d.refCount = Math.max(0, d.refCount - 1);

      if (d.refCount === 0) {
        try {
          d.detach();
        } catch {}
        dispatcher = null;
      } else {
        cleanupStreamMapsIfEmpty(d, stream);
      }
    },
  };
}
