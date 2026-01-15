// src/stubs/node/path.ts
function notSupported(name: string): never {
  throw new Error(
    `[onejs] Node builtin "path" is not available in this runtime. Tried: ${name}`
  );
}

// minimal helpers that are often "good enough" in bundler environments:
export const join = (...parts: string[]) =>
  parts.join("/").replace(/\/+/g, "/");
export const dirname = (p: string) => p.replace(/\/[^/]*$/, "") || "/";
export const basename = (p: string) => p.replace(/^.*\//, "");
export const extname = (p: string) => {
  const b = basename(p);
  const i = b.lastIndexOf(".");
  return i >= 0 ? b.slice(i) : "";
};

export const resolve = () => notSupported("path.resolve");
export default { join, dirname, basename, extname, resolve };
