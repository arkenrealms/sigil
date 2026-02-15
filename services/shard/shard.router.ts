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
    test: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) => ctx.app.service.shard.test(input, ctx)),
  });

export type Router = ReturnType<typeof createRouter>;
export type RouterInput = inferRouterInputs<Router>;
export type RouterOutput = inferRouterOutputs<Router>;
