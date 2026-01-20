// sigil/app.ts
import { initTRPC } from "@trpc/server";
import type { RouterContext } from "./types";

import * as Web from "./modules/web/web.router";
import * as Game from "./modules/game/game.router";

import { Service as WebService } from "./modules/web/web.service";
import { Service as GameService } from "./modules/game/game.service";

import { createAppTrpcCaller } from "./util/trpcCaller";

export type AppCtx = RouterContext;

export function createApp() {
  const t = initTRPC.context<AppCtx>().create();

  const { trpc, detach } = createAppTrpcCaller({
    logging: false,
    requestTimeoutMs: 15_000,
  });

  const app = {
    service: {
      web: new WebService(),
      game: new GameService(),
    },
    trpc,
    // detachTrpc: detach,
  };

  const web = Web.createRouter(t);
  const game = Game.createRouter(t);

  const router = t.router({ web, game });

  // ✅ important: derive types from router
  type AppRouter = typeof router;
  // type AppCaller = ReturnType<AppRouter["createCaller"]>;
  const ctx = { app } as AppCtx;
  const createCaller = t.createCallerFactory(router);
  const caller = createCaller(ctx);

  return { t, router, caller, app };
}

// import { createApp } from "../../app";

// const app = createApp();

// export function getApp() {
//   return app;
// }
