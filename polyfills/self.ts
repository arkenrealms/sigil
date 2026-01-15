// src/polyfills/self.ts
declare global {
  // eslint-disable-next-line no-var
  var self: any;
}

if (typeof globalThis.self === "undefined") {
  // emulate browser/worker global
  (globalThis as any).self = globalThis;
}

export {};
