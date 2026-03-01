// arken/sigil/protocol/index.ts
//
import { initTRPC } from '@trpc/server';
import { createRouter as createCoreRouter } from './core/core.router';
import * as dotenv from 'dotenv';

export * as Core from './core/core.router';

export const t = initTRPC.context<{ app: any }>().create();
export type SigilTRPC = typeof t;
export const router = t.router;
export const procedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

export const createRouter = () =>
  router({
    core: createCoreRouter(t),
  });

export type Router = ReturnType<typeof createRouter>;

dotenv.config();
