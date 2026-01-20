// sigil/util/unityEmit.ts
declare const CS: any;

/**
 * Unity "Emit" expects:
 *   Bridge.Emit(method: string, argsJson: string)
 *
 * Convention:
 *  - If input is undefined, we pass [] (matches your old emitLoad/join pattern)
 *  - Otherwise we pass JSON.stringify(input)
 */
export function unityEmit(method: string, input?: any) {
  console.log("OneJS->Unity", method, JSON.stringify(input));
  const bridge = CS?.Arken?.Evolution?.NetworkManager?.Instance;
  if (!bridge?.SendDirect)
    throw new Error("[unityEmit] NetworkManager.Instance.SendDirect missing");

  const args = input === undefined ? JSON.stringify([]) : JSON.stringify(input);
  bridge.SendDirect(method, args);
}
