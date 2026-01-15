// src/stubs/node/child_process.ts
function notSupported(name: string): never {
  throw new Error(
    `[onejs] Node builtin "child_process" is not available in this runtime. Tried: ${name}`
  );
}

export const exec = () => notSupported("child_process.exec");
export const execSync = () => notSupported("child_process.execSync");
export const spawn = () => notSupported("child_process.spawn");
export const spawnSync = () => notSupported("child_process.spawnSync");
export default { exec, execSync, spawn, spawnSync };
