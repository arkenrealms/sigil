// sigil/modules/web/web.router.ts
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
    showLogin: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) => ctx.app.service.web.showLogin(input, ctx)),

    onInitializing: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) =>
        ctx.app.service.web.onInitializing(input, ctx),
      ),

    onInitialized: t.procedure
      .input(z.object({ args: z.string().optional() }).optional())
      .mutation(({ input, ctx }) =>
        ctx.app.service.web.onInitialized(input, ctx),
      ),

    onAuthorized: t.procedure
      .input(z.object({ args: z.string() }))
      .mutation(({ input, ctx }) =>
        ctx.app.service.web.onAuthorized(input, ctx),
      ),
  });

export type Router = ReturnType<typeof createRouter>;
export type RouterInput = inferRouterInputs<Router>;
export type RouterOutput = inferRouterOutputs<Router>;
