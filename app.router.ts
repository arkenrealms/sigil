// sigil/app.router.ts
//
import { initTRPC } from "@trpc/server";

// These should be your protocol routers (same style as your other project)
import {
  createRouter as createEvolutionShardRouter,
  Router as EvolutionShardRouter,
} from "@arken/evolution-protocol/shard/shard.router";

// Example placeholders — replace with your real protocol packages:
import { createRouter as createSeerRouter } from "@arken/seer-protocol";

import type { Types as SeerTypes } from "@arken/seer-protocol";

import {
  createRouter as createWebCoreRouter,
  Router as WebRouter,
} from "./modules/web/web.router"; // if you have a protocol router for web, use that instead

// const createEvolutionRouter = () =>
//   t.router({
//     shard: createEvolutionShardRouter({} as any),
//   });

// const createWebRouter = () =>
//   t.router({
//     core: createWebCoreRouter({} as any),
//   });

// const webRouter = createWebRouter();
// const evolutionRouter = createEvolutionRouter();

// type MergedRouter = {
//   seer: SeerTypes.Router;
//   evolution: ReturnType<typeof createEvolutionRouter>;
//   // {
//   //   shard: EvolutionShardRouter;
//   // };
//   web: ReturnType<typeof createWebRouter>;
// };

const t = initTRPC.context<{}>().create();

export const createRouter = () =>
  t.router({
    seer: createSeerRouter(),
    evolution: t.router({
      shard: createEvolutionShardRouter({} as any),
    }),
    web: t.router({
      core: createWebCoreRouter({} as any),
    }),
  });

export type AppRouter = ReturnType<typeof createRouter>;
