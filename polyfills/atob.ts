// declare global {
//   // Make TS happy
//   // eslint-disable-next-line no-var
//   var atob: ((data: string) => string) | undefined;
//   // eslint-disable-next-line no-var
//   var btoa: ((data: string) => string) | undefined;
// }

// If Buffer exists (Puerts usually provides it), use it.
const hasBuffer =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as any).Buffer !== "undefined";

if (typeof globalThis.atob !== "function") {
  globalThis.atob = (data: string) => {
    if (!hasBuffer)
      throw new Error("[onejs] atob missing and Buffer not available");
    return (globalThis as any).Buffer.from(data, "base64").toString("binary");
  };
}

if (typeof globalThis.btoa !== "function") {
  globalThis.btoa = (data: string) => {
    if (!hasBuffer)
      throw new Error("[onejs] btoa missing and Buffer not available");
    return (globalThis as any).Buffer.from(data, "binary").toString("base64");
  };
}

export {};
