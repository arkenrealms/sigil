// arken/sigil/ui/game/state/inGame.store.ts
import { useEffect, useState } from "preact/hooks";

(globalThis as any).__SIGIL_STORE_ID__ ??= Math.random().toString(16).slice(2);
console.log("[store] loaded", (globalThis as any).__SIGIL_STORE_ID__);

export type ServerState =
  | "none"
  | "loading"
  | "authorizing"
  | "joining"
  | "joined"
  | "spectating"
  | "disconnected";

export type WebState =
  | "none"
  | "initializing"
  | "initialized"
  | "authorizing"
  | "authorized";

export type GameInfo = {
  timerSec?: number;
  rewardWinnerAmount?: string;
  rewardWinnerName?: string;
  rewardItemAmount?: string;
  rewardItemName?: string;
  gameMode?: string;
};

export type Reward = {
  id: string;
  rewardItemType?: string;
  rewardItemName: string;
  quantity: string;
  position?: { x: string; y: string };
  shortDescription?: string;
  longDescription?: string;
};

export type Upgrade = {
  id: string;
  keybind: string;
  name: string;
  description: string;
  src?: string;
};

export type GameState = {
  serverState: ServerState;
  webState: WebState;

  profile: any | null;

  gameInfo: GameInfo;
  serverTimerSec: number | null;

  reward: Reward | null;

  roundId: string;

  isUpgradeOpen: boolean;
  upgrades: Upgrade[];
};

const state: GameState = {
  serverState: "none",
  webState: "none",

  profile: null,

  gameInfo: {},
  serverTimerSec: null,

  reward: null,

  roundId: "",

  isUpgradeOpen: false,
  upgrades: [],
};

const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

export function getGameState(): GameState {
  return state;
}

export function setGameState(patch: Partial<GameState>) {
  console.log("[store] setGameState", JSON.stringify(patch));

  let changed = false;
  for (const k in patch) {
    const key = k as keyof GameState;
    const next = (patch as any)[key];
    if ((state as any)[key] !== next) {
      (state as any)[key] = next;
      changed = true;
    }
  }
  if (changed) emit();
}

export function useGameStore(): GameState {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);
  return state;
}
