// src/stubs/node/readline.ts
function notSupported(name: string): never {
  throw new Error(
    `[onejs] Node builtin "readline" is not available in this runtime. Tried: ${name}`
  );
}

export const createInterface = () => notSupported("readline.createInterface");
export default { createInterface };
