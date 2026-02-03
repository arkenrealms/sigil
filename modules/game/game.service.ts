// sigil/modules/game/game.service.ts
//
// import { loadPrefsJson, clearPrefs } from "../../ui/core/state/persist";
import { getAppData, setAppData } from "../../ui/game/state/useAppData";
import { isValidAuth } from "../../util/isValidAuth";
import { ensureManagedScenes, onChangeGame } from "../../util/unity/scene";

declare const CS: any;

function parseRoundInfo(payload: string) {
  const parts = (payload ?? "").split(":");
  if (parts.length < 10) return {};

  const timer = parts[0];
  const gameMode = parts[22];
  const rewardItemAmount = parts[45];
  const rewardItemName = parts[46];
  const rewardWinnerAmount = parts[47];
  const rewardWinnerName = parts[48];

  const timerSec = Number(timer);
  return {
    timerSec: Number.isFinite(timerSec) ? timerSec : undefined,
    gameMode,
    rewardItemAmount,
    rewardItemName,
    rewardWinnerAmount,
    rewardWinnerName,
  };
}

function rewardDescriptions(name: string) {
  const n = (name ?? "").toLowerCase();
  if (n === "harold") {
    return {
      shortDescription: "HAROLD token is based on the Hide The Pain meme.",
      longDescription:
        "It was rugged by the original creator and is has been adopted by the community and a very big whale.",
    };
  }
  if (n === "pepe") {
    return {
      shortDescription: "Pepe is a well known meme.",
      longDescription: "Pepe stuff",
    };
  }
  return {
    shortDescription: "DOGE is a shiba inu.",
    longDescription: "Doge stuff",
  };
}

export class Service {
  async onConnected(input: any, { app }) {
    console.log(
      "Sigil.Service.Game.onConnected",
      JSON.stringify(input),
      app.settings.serverState,
    );
    if (app.settings.serverState !== "connecting") return;

    app.settings = { serverState: "loading" };

    await app.trpc.evolution.shard.load.mutate();
  }

  async onDisconnected(input: any, { app }) {
    console.log("Sigil.Service.Game.onDisconnected", JSON.stringify(input));
    CS.Arken.Evolution.NetworkManager.Instance.ResetGame();

    app.settings = {
      serverState: "disconnected",
      reward: null,
      isUpgradeOpen: false,
      upgrades: [],
    };
  }

  /**
   * Trigger: Unity emits "onLoaded" -> router -> service.
   * ✅ Service does NOT care about transport.
   * It calls ctx.app.trpc.<backend>.<router>.<proc>
   */
  async onLoaded(input: any, { app }) {
    console.log(
      "Sigil.Service.Game.onLoaded",
      JSON.stringify(input),
      app.settings.serverState,
    );
    if (app.settings.serverState !== "loading") return;

    // if (isValidAuth(auth)) {
    //   app.settings = { serverState: "authorizing" };

    //   // Keep native var in sync if you still use it on C# side
    //   if (CS?.Arken?.Evolution?.NetworkManager?.Instance) {
    //     CS.Arken.Evolution.NetworkManager.Instance.myPlayerAddress =
    //       auth.address;
    //   }

    //   // ✅ Transport-agnostic RPC call
    //   await app.trpc.evolution.shard.login.mutate({
    //     name: auth.name,
    //     network: "bsc",
    //     address: auth.address,
    //     device: "desktop",
    //     signature: auth.token,
    //     version: "1.9.0",
    //   });

    //   return;
    // }

    // ✅ important: if invalid auth exists, wipe it so you don't loop forever
    // if (auth) {
    //   app.settings = { auth: undefined };
    // }

    // Equivalent to old OnGameStart setup
    CS.Arken.LoaderHandler.Instance.loadedGame = CS.Arken.ArkenGame.Evolution;

    await ensureManagedScenes(
      ["Shared", "E_Game", "E_Pool", "Sound", "E_MageIsles"],
      {
        managedScenes: [
          "Entry",
          "Shared",
          // "E_UI",
          "E_Pool",
          "Sound",
          "E_Game",
          "R_Game",
          "E_MageIsles",
          "E_MemeIsles",
          "E_EndOfTime",
        ],
        logging: true,
        // Keep sequential loading unless you *know* parallel is safe
        parallel: false,
      },
    );

    app.settings = { serverState: "loaded" };

    app.service.network.checkConnections(null, { app });
  }

  async onLogin(input: any, { app }) {
    console.log(
      "Sigil.Service.Game.onLogin",
      JSON.stringify(input),
      app.settings.serverState,
    );
    if (app.settings.serverState !== "authorizing") return;

    await app.trpc.evolution.shard.join.mutate();

    app.settings = { serverState: "joining" };
  }

  onJoinGame(input: any, { app }) {
    console.log("Sigil.Service.Game.onJoinGame", JSON.stringify(input));
    app.settings = { serverState: "joined" };
  }

  onSpectate(input: any, { app }) {
    app.settings = { serverState: "spectating" };
  }

  onGameOver(input: any, { app }) {
    app.settings = { serverState: "spectating" };
  }

  onSetRoundInfo(input: { args: string }, { app }) {
    const raw = input.args ?? "";
    const parts = raw.split(":");

    // Replace with your true round id index if different.
    const nextRoundId = parts[22] ?? "";

    const info = parseRoundInfo(raw);
    const prev = getAppData();

    app.settings = {
      roundId: nextRoundId || prev.roundId,
      gameInfo: { ...prev.gameInfo, ...info },
      serverTimerSec:
        typeof (info as any).timerSec === "number"
          ? (info as any).timerSec
          : prev.serverTimerSec,
    };
  }

  onSpawnReward(input: { args: string }, { app }) {
    const data = (input.args ?? "").split(":");
    const id = data[0] ?? "";
    const rewardItemType = data[1] ?? "";
    const rewardItemName = data[2] ?? "";
    const quantity = data[3] ?? "";
    const x = data[4] ?? "";
    const y = data[5] ?? "";

    app.settings = {
      reward: {
        id,
        rewardItemType,
        rewardItemName,
        quantity,
        position: { x, y },
        ...rewardDescriptions(rewardItemName),
      },
    };
  }

  onUpdatePlayer(input: any, { app }) {}

  onSetPositionMonitor(input: any, { app }) {}

  onBroadcast(input: any, { app }) {}

  onHideMinimap(input: any, { app }) {}

  onOpenLevel2(input: any, { app }) {}

  onSpawnPowerUp(input: any, { app }) {}

  onUpdateReward(input: any, { app }) {}

  onUpdateBestClient(input: any, { app }) {}

  onSpawnClient(input: any, { app }) {}

  onUpdatePickup(input: any, { app }) {}

  onUpdateEvolution(input: any, { app }) {}

  onUpgrade(input: { args: string }, { app }) {
    const raw = input.args ?? "";
    try {
      const parts = raw.split(",");
      const upgradeId1 = parts[1];
      const upgradeId2 = parts[2];
      const upgradeId3 = parts[3];

      app.settings = {
        upgrades: [
          {
            id: upgradeId1,
            keybind: "1",
            name: "BLM Shield",
            description: "…",
            src: "/images/skills/200.png",
          },
          {
            id: upgradeId2,
            keybind: "2",
            name: "Montana Speed",
            description: "…",
            src: "/images/skills/201.png",
          },
          {
            id: upgradeId3,
            keybind: "3",
            name: "Forrest Bump's Blessing",
            description: "…",
            src: "/images/skills/202.png",
          },
        ],
        isUpgradeOpen: true,
      };
    } catch {
      console.warn("[Upgrade] Failed to parse onUpgrade payload", raw);
    }
  }

  onChangeScene(scene: string) {}

  onClearLeaderboard() {}
}
