// sigil/util/bindUnityBridge.ts
import {
  onUnityServerEvent,
  onUnityWebEvent,
} from "../modules/game/unityEvents";

declare const CS: any;

export function bindUnityBridge() {
  const bridge = CS?.Arken?.Bridge?.Instance;
  if (!bridge) {
    console.warn("[OneJS] Bridge.Instance missing");
    return () => {};
  }

  const onServer = (eventName: string, args: string) => {
    // keep fast; don't await
    void onUnityServerEvent(eventName, args);
  };

  const onWeb = (eventName: string, args: string) => {
    void onUnityWebEvent(eventName, args);
  };

  bridge.add_OnServerEvent?.(onServer);
  bridge.add_OnWebEvent?.(onWeb);

  return () => {
    bridge.remove_OnServerEvent?.(onServer);
    bridge.remove_OnWebEvent?.(onWeb);
  };
}
