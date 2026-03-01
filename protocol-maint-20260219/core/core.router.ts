// arken/sigil/protocol/core/core.router.ts
//
import { z } from 'zod';
import { Query, getQueryInput, inferRouterOutputs, inferRouterInputs } from '../util/schema';
import { type SigilTRPC } from '../';

export const createRouter = (t: SigilTRPC) =>
  t.router({
    onClick: t.procedure.input(z.any()).mutation(({ input, ctx }) => ctx.app.service.core.onClick(input, ctx)),

    onAppInitializing: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) => ctx.app.service.core.onAppInitializing(input, ctx)),

    onWebviewError: t.procedure
      .input(z.string())
      .mutation(({ input, ctx }) => ctx.app.service.core.onWebviewError(input, ctx)),

    onWebInitializing: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) => ctx.app.service.core.onWebInitializing(input, ctx)),

    onWebInitialized: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) => ctx.app.service.core.onWebInitialized(input, ctx)),

    // deprecated
    onInitialized: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) => ctx.app.service.core.onWebInitialized(input, ctx)),

    onWebAuthorized: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) => ctx.app.service.core.onWebAuthorized(input, ctx)),

    onAuthorized: t.procedure
      .input(z.any())
      .mutation(({ input, ctx }) => ctx.app.service.core.onWebAuthorized(input, ctx)),
  });

export type Router = ReturnType<typeof createRouter>;
export type RouterInput = inferRouterInputs<Router>;
export type RouterOutput = inferRouterOutputs<Router>;
