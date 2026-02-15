// sigil/services/game/game.router.ts
//
import { z } from "zod";

export const createRouter = (t: any) =>
  t.router({
    onChangeGame: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onChangeGame(input, ctx),
      ),

    onConnected: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onConnected(input, ctx),
      ),

    onDisconnected: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onDisconnected(input, ctx),
      ),

    onLoaded: t.procedure
      .input(z.number())
      .mutation(({ input, ctx }) => ctx.app.service.game.onLoaded(input, ctx)),

    onLogin: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) => ctx.app.service.game.onLogin(input, ctx)),

    onJoinGame: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onJoinGame(input, ctx),
      ),

    onRoundWinner: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onRoundWinner(input, ctx),
      ),

    onSpectate: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onSpectate(input, ctx),
      ),

    onGameOver: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onGameOver(input, ctx),
      ),

    onSetRoundInfo: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onSetRoundInfo(input, ctx),
      ),

    onSpawnReward: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onSpawnReward(input, ctx),
      ),

    onUpdateReward: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onUpdateReward(input, ctx),
      ),

    onUpgrade: t.procedure
      .input(z.any())
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

    onRoundPaused: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onRoundPaused(input, ctx),
      ),

    onUpdateEvolution: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onUpdateEvolution(input, ctx),
      ),

    onUpdateRegression: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.game.onUpdateRegression(input, ctx),
      ),
  });
