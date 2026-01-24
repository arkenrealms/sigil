// sigil/modules/core/core.router.ts
//
import { z } from "zod";
import {
  Query,
  getQueryInput,
  inferRouterOutputs,
  inferRouterInputs,
} from "../../util/schema";

export const createRouter = (t: any) =>
  t.router({
    onInitializing: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) =>
        ctx.app.service.core.onInitializing(input, ctx),
      ),

    onInitialized: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) =>
        ctx.app.service.core.onInitialized(input, ctx),
      ),

    onAuthorized: t.procedure
      .input(z.object({ args: z.string() }))
      .mutation(({ input, ctx }) =>
        ctx.app.service.core.onAuthorized(input, ctx),
      ),
  });

export type Router = ReturnType<typeof createRouter>;
export type RouterInput = inferRouterInputs<Router>;
export type RouterOutput = inferRouterOutputs<Router>;
