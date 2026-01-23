// sigil/appInstance.ts
import { createApp } from "./app";

let _app: ReturnType<typeof createApp> | null = null;

export function getApp() {
  if (!_app) _app = createApp();
  return _app;
}

export function resetApp() {
  try {
    _app?.detachTrpc?.();
  } catch {}
  _app = null;
}
