// sigil/polyfills/abort-controller.ts

type AbortListener = (evt?: any) => void;

type AddOptions =
  | boolean
  | {
      once?: boolean;
      // (we can ignore capture/passive/signal for now)
      capture?: boolean;
      passive?: boolean;
      signal?: any;
    };

class AbortSignalPolyfill {
  aborted = false;
  reason: any = undefined;

  private listeners = new Map<AbortListener, { once: boolean }>();

  addEventListener(type: string, cb: any, options?: AddOptions) {
    if (type !== "abort" || typeof cb !== "function") return;

    const once =
      typeof options === "object" && options !== null ? !!options.once : false;

    this.listeners.set(cb as AbortListener, { once });

    // If already aborted, spec-ish behavior is "fire asap"
    if (this.aborted) {
      // fire on next microtask to avoid reentrancy surprises
      Promise.resolve().then(() => {
        if (!this.listeners.has(cb)) return;
        try {
          (cb as AbortListener)({ type: "abort" });
        } catch {}
        if (once) this.listeners.delete(cb);
      });
    }
  }

  removeEventListener(type: string, cb: any) {
    if (type !== "abort") return;
    this.listeners.delete(cb as AbortListener);
  }

  dispatchEvent(evt: any) {
    // clone to allow removal while iterating
    const items = Array.from(this.listeners.entries());
    for (const [cb, meta] of items) {
      try {
        cb(evt);
      } catch {}
      if (meta.once) this.listeners.delete(cb);
    }
    return true;
  }
}

class AbortControllerPolyfill {
  signal: AbortSignalPolyfill;

  constructor() {
    this.signal = new AbortSignalPolyfill();
  }

  abort(reason?: any) {
    if (this.signal.aborted) return;
    this.signal.aborted = true;
    this.signal.reason = reason;
    console.log(
      "AbortController abort called, not sure why, not going to dispatch",
    );
    // this.signal.dispatchEvent({ type: "abort" });
  }
}

export function ensureAbortController() {
  const g: any = globalThis as any;
  if (!g.AbortController) g.AbortController = AbortControllerPolyfill;
  if (!g.AbortSignal) g.AbortSignal = AbortSignalPolyfill;
}

ensureAbortController();
