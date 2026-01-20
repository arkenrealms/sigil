// sigil/polyfills/abort-controller.ts
// Minimal AbortController polyfill for environments that don't have it (Puerts/OneJS).
// Enough for tRPC client to construct and check `.signal.aborted`.

type Listener = () => void;

class AbortSignalPolyfill {
  aborted = false;
  private listeners = new Set<Listener>();

  addEventListener(type: string, cb: any) {
    if (type !== "abort") return;
    this.listeners.add(cb as Listener);
  }
  removeEventListener(type: string, cb: any) {
    if (type !== "abort") return;
    this.listeners.delete(cb as Listener);
  }
  dispatchEvent(_evt: any) {
    for (const l of this.listeners) {
      try {
        l();
      } catch {}
    }
    return true;
  }
}

class AbortControllerPolyfill {
  signal: AbortSignalPolyfill;
  constructor() {
    this.signal = new AbortSignalPolyfill();
  }
  abort() {
    if (this.signal.aborted) return;
    this.signal.aborted = true;
    this.signal.dispatchEvent({ type: "abort" });
  }
}

// Install on globalThis if missing
export function ensureAbortController() {
  const g: any = globalThis as any;
  if (!g.AbortController) g.AbortController = AbortControllerPolyfill;
  if (!g.AbortSignal) g.AbortSignal = AbortSignalPolyfill;
}

ensureAbortController();
