// sigil/app.ts
import { initTRPC } from "@trpc/server";
import type { RouterContext } from "./types";

import * as Web from "./modules/web/web.router";
import * as Game from "./modules/game/game.router";

import { Service as WebService } from "./modules/web/web.service";
import { Service as GameService } from "./modules/game/game.service";

import { createAppTrpcCaller } from "./util/trpc";
import type { AppTrpcCaller } from "./util/trpc";

import { createTrpcHooks } from "./util/trpcHooks";
import { createUnityStreamSocket } from "./util/unityStreamSocket";

export type AppCtx = RouterContext & {
  app: {
    service: {
      web: WebService;
      game: GameService;
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

function getProc(router: any, ns: "web" | "game", eventName: string) {
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
  const { hooks: remoteTrpc, detach } = createAppTrpcCaller({ logging: true });

  const app: any = {
    service: {
      web: new WebService(),
      game: new GameService(),
    },
    trpc: remoteTrpc, // we’ll augment with local below
    detachTrpc: () => detach(),
  };

  // -------------------------
  // Local routers (run inside this JS runtime)
  // -------------------------
  const router = t.router({
    web: Web.createRouter(t),
    game: Game.createRouter(t),
  });

  const ctx = { app } as AppCtx;
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

  // Create local hook facade for web/game namespaces
  const localTrpc = createTrpcHooks(localBase, { logging: true });

  // ✅ Merge: keep remote namespaces (seer/evolution/forge), add local (web/game)
  (app.trpc as any).web = (localTrpc as any).web;
  (app.trpc as any).game = (localTrpc as any).game;

  // -------------------------
  // Stream -> Local router bindings
  // -------------------------
  const sigilWebSock = createUnityStreamSocket("sigil.web");
  const sigilGameSock = createUnityStreamSocket("sigil.game");

  // console.log(
  //   "22222",
  //   Object.keys(router.web),
  //   // Object.keys(router?.procedures),
  //   // Object.keys(router?._def?.procedures.web),
  // );
  const bindLocalStream = (ns: "web" | "game", sock: any) => {
    const handler = async (eventName: string, payload: any) => {
      const proc = getProc(router as any, ns, eventName);
      if (!proc) {
        // 🔎 if you see this, your router proc name doesn't match the Unity eventName
        console.warn(`[sigil] local dispatch: unknown ${ns}.${eventName}`);
        return;
      }

      const fn = (localCaller as any)?.[ns]?.[eventName];
      if (typeof fn !== "function") {
        console.warn(
          `[sigil] local dispatch: missing caller fn ${ns}.${eventName}`,
        );
        return;
      }

      if (procExpectsVoid(proc)) {
        await fn(undefined);
        return;
      }

      const args = toArgsString(payload);
      await fn(args === undefined ? undefined : { args });
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

  const offSigilWeb = bindLocalStream("web", sigilWebSock);
  const offSigilGame = bindLocalStream("game", sigilGameSock);

  // Cleanup
  app.detachTrpc = () => {
    try {
      offSigilWeb();
    } catch (e) {
      console.log("E222", "Error detaching sigil web");
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
    sigil: localCaller,
    // remote namespaces
    seer: app.trpc.seer,
    evolution: app.trpc.evolution,
    forge: app.trpc.forge,
    // local namespaces
    web: app.trpc.web,
    game: app.trpc.game,
  } as const;

  return { ...app, t, router, caller, ctx };
}
