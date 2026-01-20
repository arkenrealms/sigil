// sigil/modules/game/unityEvents.ts
import { getApp } from "../../appInstance";

export async function onUnityServerEvent(eventName: string, args: string) {
  const app = getApp();

  console.log("trying to handle unity server event", eventName, args);
  // return;
  // map unity event -> caller
  switch (eventName) {
    case "onLoaded":
      // @ts-ignore
      return app.caller.game.onLoaded({ args });
    case "onLogin":
      // @ts-ignore
      return app.caller.game.onLogin({ args });
    case "onJoinGame":
      // @ts-ignore
      return app.caller.game.onJoinGame({ args });
    case "onSpectate":
      // @ts-ignore
      return app.caller.game.onSpectate({ args });
    case "onGameOver":
      // @ts-ignore
      return app.caller.game.onGameOver({ args });
    case "onDisconnected":
      // @ts-ignore
      return app.caller.game.onDisconnected({ args });

    case "onSetRoundInfo":
      // @ts-ignore
      return app.caller.game.onSetRoundInfo({ args });
    case "onSpawnReward":
      // @ts-ignore
      return app.caller.game.onSpawnReward({ args });
    case "onUpdateReward":
      // @ts-ignore
      return app.caller.game.onUpdateReward({ args });
    case "onUpgrade":
      // @ts-ignore
      return app.caller.game.onUpgrade({ args });

    default:
      return;
  }
}

export async function onUnityWebEvent(eventName: string, args: string) {
  console.log("trying to call unity web event", eventName, args);
  return;
  switch (eventName) {
    case "onInitializing":
      // @ts-ignore
      return app.caller.web.onInitializing({ args });
    case "onInitialized":
      // @ts-ignore
      return app.caller.web.onInitialized({ args });
    case "onAuthorized":
      // @ts-ignore
      return app.caller.web.onAuthorized({ args });
    default:
      return;
  }
}
