// sigil/types.ts
//
import type { AppTrpcCaller } from "./util/trpcCaller";

export type ApplicationServiceType = Partial<{
  // Internal app services (not tRPC)
  web: any;
  game: any;
}>;

export interface Application {
  service: ApplicationServiceType;

  /**
   * ✅ Generic, multi-backend TRPC caller surface.
   * Think: ctx.service.evolution.shard.login.mutate(...)
   * This is the ONLY thing "domain services" should use for RPC.
   */
  trpc: AppTrpcCaller;
}

export type RouterContext = {
  app: Application;
};