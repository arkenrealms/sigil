// src/stubs/node/fs.ts
function notSupported(name: string): never {
  throw new Error(
    `[onejs] Node builtin "fs" is not available in this runtime. Tried: ${name}`
  );
}

export const readFileSync = () => notSupported("fs.readFileSync");
export const writeFileSync = () => notSupported("fs.writeFileSync");
export const existsSync = () => notSupported("fs.existsSync");
export const promises = new Proxy(
  {},
  { get: () => notSupported("fs.promises.*") }
);

export default { readFileSync, writeFileSync, existsSync, promises };
