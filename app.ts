// sigil/app.ts
import { initTRPC } from "@trpc/server";
import type { RouterContext } from "./types";

import * as Core from "./services/core/core.router";
import * as Game from "./games/evolution-isles/services/game/game.router";

import { Service as CoreService } from "./services/core/core.service";
import { Service as NetworkService } from "./services/network/network.service";
import { Service as RealmService } from "./services/realm/realm.service";
import { Service as ShardService } from "./services/shard/shard.service";
import { Service as EvolutionIslesGameService } from "./games/evolution-isles/services/game/game.service";

import { createAppTrpcCaller } from "./util/trpc";
import type { AppTrpcCaller } from "./util/trpc";

import { createTrpcHooks } from "./util/trpcHooks";
import { createUnityStreamSocket } from "./util/unityStreamSocket";
import { getAppData, setAppData } from "./ui/game/state/useAppData";
import {
  loadPrefsJson,
  savePrefsJson,
  clearPrefs,
} from "./ui/core/state/persist";

export type AppCtx = RouterContext & {
  data: any;
  app: {
    service: {
      core: CoreService;
      game: EvolutionIslesGameService;
      network: NetworkService;
      realm: RealmService;
      shard: ShardService;
    };
    trpc: AppTrpcCaller; // local + remote (same surface)
  };
};

function toArgsString(payload: any): string | undefined {
  if (payload === undefined || payload === null) return undefined;
  if (Array.isArray(payload) && payload.length === 0) return undefined;
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

function getProc(router: any, ns: "core" | "game", eventName: string) {
  return router?.[ns]?.[eventName];
}

function procExpectsVoid(proc: any): boolean {
  const parser = proc?._def?.inputs?.[0];
  return parser?._def?.typeName === "ZodVoid";
}

function getCallerFn(localCaller: any, ns: string, procPath: string) {
  const parts = String(procPath || "")
    .split(".")
    .filter(Boolean);
  let cur = localCaller?.[ns];
  for (const p of parts) cur = cur?.[p];
  return cur;
}

export function createApp() {
  const t = initTRPC.context<AppCtx>().create();

  // -------------------------
  // Remote tRPC (Unity backends)
  // -------------------------
  const {
    hooks: remoteTrpc,
    detach,
    clients,
  } = createAppTrpcCaller({ logging: true });

  const app: any = {
    service: {
      core: new CoreService(),
      game: new EvolutionIslesGameService(),
      network: new NetworkService(),
      realm: new RealmService(),
      shard: new ShardService(),
    },
    trpc: remoteTrpc, // we’ll augment with local below
    gameKey: undefined,
    detachTrpc: () => detach(),
    get data() {
      return getAppData();
    },
    set data(req) {
      setAppData(req);
    },
    get settings() {
      let settings = getAppData().settings;

      if (!settings) {
        settings = loadPrefsJson("settings");

        setAppData({ settings });
      }

      return settings;
    },
    set settings(req) {
      if (!req) {
        clearPrefs("settings");
      } else {
        savePrefsJson("settings", req);
        setAppData({ settings: loadPrefsJson("settings") });
      }
    },
  };

  // -------------------------
  // Local routers (run inside this JS runtime)
  // -------------------------

  const createRouter = () =>
    t.router({
      core: Core.createRouter(t),
      game: Game.createRouter(t),
    });

  const router = createRouter();

  const ctx = {
    app,
  } as AppCtx;

  if (!ctx.app?.service?.core) {
    throw new Error(
      "[sigil] ctx.app.service.core missing (createCaller ctx is wrong)",
    );
  }
  if (!ctx.app?.service?.game) {
    throw new Error(
      "[sigil] ctx.app.service.game missing (createCaller ctx is wrong)",
    );
  }

  const createCaller = t.createCallerFactory(router);
  const localCaller = createCaller(ctx);

  // Local base: path string -> localCaller.<ns>.<proc>(input)
  const localBase = {
    query: async (path: string, input?: any) => {
      const [ns, ...rest] = String(path).split(".").filter(Boolean);
      const proc = rest.join(".");
      const fn = getCallerFn(localCaller as any, ns, proc);
      if (typeof fn !== "function") {
        throw new Error(`[local trpc] unknown query: ${ns}.${proc}`);
      }
      return fn(input);
    },
    mutation: async (path: string, input?: any) => {
      const [ns, ...rest] = String(path).split(".").filter(Boolean);
      const proc = rest.join(".");
      const fn = getCallerFn(localCaller as any, ns, proc);
      if (typeof fn !== "function") {
        throw new Error(`[local trpc] unknown mutation: ${ns}.${proc}`);
      }
      return fn(input);
    },
  };

  // Create local hook facade for core/game namespaces
  const localTrpc = createTrpcHooks(localBase, { logging: true });

  // const target = method.split('.').reduce<any>((acc, key) => acc[key], caller);
  // -------------------------
  // Stream -> Local router bindings
  // -------------------------
  const sigilCoreSock = createUnityStreamSocket("sigil.core", clients);
  const sigilGameSock = createUnityStreamSocket("sigil.game", clients);

  const bindLocalStream = (ns: "core" | "game", sock: any) => {
    const handler = async (eventName: string, payload: any) => {
      console.log("bindLocalStream", eventName, JSON.stringify(payload));

      const proc = getProc(router as any, ns, eventName);
      if (!proc) {
        // 🔎 if you see this, your router proc name doesn't match the Unity eventName
        console.warn(`[sigil] local dispatch: unknown ${ns}.${eventName}`);
        return;
      }

      const fn = (localCaller as any)?.[ns]?.[eventName];
      if (typeof fn !== "function") {
        console.warn("[sigil] missing caller fn", {
          ns,
          eventName,
          keys: Object.keys(localCaller as any),
        });
        return;
      }

      try {
        // existing logic
        if (procExpectsVoid(proc)) {
          await fn(undefined);
        } else {
          // const args = payload; // toArgsString(payload);
          await fn(!payload && payload !== 0 ? undefined : payload);
        }
      } catch (e) {
        console.warn(
          "[sigil] error calling local route (check route execution)",
          JSON.stringify({ ns, eventName, payload }),
          e,
        );

        throw e; // keep surfacing through unityStreamSocket
      }
    };

    sock.onAny(handler);

    return () => {
      try {
        sock.offAny(handler);
      } catch (e) {
        console.log("E224", "Error turning off socket handlers");
      }
      try {
        sock.destroy();
      } catch (e) {
        console.log("E223", "Error destroying socket");
      }
    };
  };

  const offSigilCore = bindLocalStream("core", sigilCoreSock);
  const offSigilGame = bindLocalStream("game", sigilGameSock);

  // Cleanup
  app.detachTrpc = () => {
    try {
      offSigilCore();
    } catch (e) {
      console.log("E222", "Error detaching sigil core");
    }
    try {
      offSigilGame();
    } catch (e) {
      console.log("E222", "Error detaching sigil game");
    }
    try {
      detach();
    } catch (e) {
      console.log("E222", "Error detaching all");
    }
  };

  const caller = {
    sigil: localTrpc,
    // remote namespaces
    seer: app.trpc.seer,
    evolution: app.trpc.evolution,
    forge: app.trpc.forge,
    // local namespaces
    // core: app.trpc.core,
    // game: app.trpc.game,
  } as const;

  return { ...app, t, router, caller, ctx };
}
