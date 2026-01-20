// sigil/appInstance.ts
import { createApp } from "./app";

let _app: ReturnType<typeof createApp> | null = null;

export function getApp() {
  if (!_app) _app = createApp();
  return _app;
}

// If you ever need to reset during hot reload:
export function resetApp() {
  _app = null;
}
