// sigil/modules/game/game.service.ts
//
import { loadPrefsJson, clearPrefs } from "../../ui/core/state/persist";
import { getGameState, setGameState } from "../../ui/game/state/useGameStore";

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
  /**
   * Trigger: Unity emits "onLoaded" -> router -> service.
   * ✅ Service does NOT care about transport.
   * It calls ctx.app.trpc.<backend>.<router>.<proc>
   */
  async onLoaded(_input: any, ctx: any) {
    const auth: any = loadPrefsJson("auth");

    console.log(
      "Service.Game.onLoaded",
      JSON.stringify(_input),
      JSON.stringify(auth),
      ctx,
    );

    if (auth?.address && auth?.token) {
      setGameState({ serverState: "authorizing" });

      // Keep native var in sync if you still use it on C# side
      if (CS?.Arken?.Evolution?.NetworkManager?.Instance) {
        CS.Arken.Evolution.NetworkManager.Instance.myPlayerAddress =
          auth.address;
      }

      // ✅ Transport-agnostic RPC call
      await ctx.app.trpc.evolution.shard.login.mutate({
        name: auth.name,
        network: "bsc",
        address: auth.address,
        device: "desktop",
        signature: auth.token,
        version: "1.9.0",
      });

      return;
    }

    setGameState({ serverState: "loading" });
  }

  onLogin(_input: any, _ctx: any) {
    setGameState({ serverState: "joining" });
  }

  onJoinGame(_input: any, _ctx: any) {
    setGameState({ serverState: "joined" });
  }

  onSpectate(_input: any, _ctx: any) {
    setGameState({ serverState: "spectating" });
  }

  onGameOver(_input: any, _ctx: any) {
    setGameState({ serverState: "spectating" });
  }

  onDisconnected(_input: any, _ctx: any) {
    setGameState({
      serverState: "disconnected",
      reward: null,
      isUpgradeOpen: false,
      upgrades: [],
    });
    clearPrefs("sigil.ingame.cache.v1");
  }

  onSetRoundInfo(input: { args: string }, _ctx: any) {
    const raw = input.args ?? "";
    const parts = raw.split(":");

    // Replace with your true round id index if different.
    const nextRoundId = parts[22] ?? "";

    const info = parseRoundInfo(raw);
    const prev = getGameState();

    setGameState({
      roundId: nextRoundId || prev.roundId,
      gameInfo: { ...prev.gameInfo, ...info },
      serverTimerSec:
        typeof (info as any).timerSec === "number"
          ? (info as any).timerSec
          : prev.serverTimerSec,
    });
  }

  onSpawnReward(input: { args: string }, _ctx: any) {
    const data = (input.args ?? "").split(":");
    const id = data[0] ?? "";
    const rewardItemType = data[1] ?? "";
    const rewardItemName = data[2] ?? "";
    const quantity = data[3] ?? "";
    const x = data[4] ?? "";
    const y = data[5] ?? "";

    setGameState({
      reward: {
        id,
        rewardItemType,
        rewardItemName,
        quantity,
        position: { x, y },
        ...rewardDescriptions(rewardItemName),
      },
    });
  }

  onUpdateReward(_input: any, _ctx: any) {
    setGameState({ reward: null });
  }

  onUpgrade(input: { args: string }, _ctx: any) {
    const raw = input.args ?? "";
    try {
      const parts = raw.split(",");
      const upgradeId1 = parts[1];
      const upgradeId2 = parts[2];
      const upgradeId3 = parts[3];

      setGameState({
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
      });
    } catch {
      console.warn("[Upgrade] Failed to parse onUpgrade payload", raw);
    }
  }

  onChangeScene(scene: string) {}
}
