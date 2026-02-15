// sigil/services/core/core.router.ts
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
    checkConnections: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) =>
        ctx.app.service.network.checkConnections(input, ctx),
      ),

    // onWebInitializing: t.procedure
    //   .input(z.any())
    //   .mutation(({ input, ctx }) =>
    //     ctx.app.service.network.onWebInitializing(input, ctx),
    //   ),

    // onWebInitialized: t.procedure
    //   .input(z.any())
    //   .mutation(({ input, ctx }) =>
    //     ctx.app.service.network.onWebInitialized(input, ctx),
    //   ),

    // onWebAuthorized: t.procedure
    //   .input(z.any())
    //   .mutation(({ input, ctx }) =>
    //     ctx.app.service.network.onWebAuthorized(input, ctx),
    //   ),
  });

export type Router = ReturnType<typeof createRouter>;
export type RouterInput = inferRouterInputs<Router>;
export type RouterOutput = inferRouterOutputs<Router>;
