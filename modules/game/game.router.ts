// sigil/modules/game/game.router.ts
//
import { z } from "zod";

export const createRouter = (t: any) =>
  t.router({
    onLoaded: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) => ctx.app.service.game.onLoaded(input, ctx)),

    onLogin: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) => ctx.app.service.game.onLogin(input, ctx)),

    onJoinGame: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onJoinGame(input, ctx),
      ),

    onSpectate: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onSpectate(input, ctx),
      ),

    onGameOver: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onGameOver(input, ctx),
      ),

    onDisconnected: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onDisconnected(input, ctx),
      ),

    onSetRoundInfo: t.procedure
      .input(z.object({ args: z.string() }))
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onSetRoundInfo(input, ctx),
      ),

    onSpawnReward: t.procedure
      .input(z.object({ args: z.string() }))
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onSpawnReward(input, ctx),
      ),

    onUpdateReward: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onUpdateReward(input, ctx),
      ),

    onUpgrade: t.procedure
      .input(z.object({ args: z.string() }))
      .mutation(({ input, ctx }) => ctx.app.service.game.onUpgrade(input, ctx)),

    onClearLeaderboard: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onClearLeaderboard(input, ctx),
      ),

    onUpdatePlayer: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onUpdatePlayer(input, ctx),
      ),

    onSetPositionMonitor: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onSetPositionMonitor(input, ctx),
      ),

    onBroadcast: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onBroadcast(input, ctx),
      ),

    onHideMinimap: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onHideMinimap(input, ctx),
      ),

    onOpenLevel2: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onOpenLevel2(input, ctx),
      ),

    onSpawnPowerUp: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onSpawnPowerUp(input, ctx),
      ),

    onUpdateBestClient: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onUpdateBestClient(input, ctx),
      ),

    onSpawnClient: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onSpawnClient(input, ctx),
      ),

    onUpdatePickup: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onUpdatePickup(input, ctx),
      ),

    onUpdateEvolution: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onUpdateEvolution(input, ctx),
      ),
  });
