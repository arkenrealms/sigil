export function notSupported(moduleName: string) {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          `[onejs] Node builtin "${moduleName}" is not available in this runtime.`
        );
      },
      apply() {
        throw new Error(
          `[onejs] Node builtin "${moduleName}" is not available in this runtime.`
        );
      },
      construct() {
        throw new Error(
          `[onejs] Node builtin "${moduleName}" is not available in this runtime.`
        );
      },
    }
  );
}
