import { useCallback, useMemo, useRef, useState } from "preact/hooks";

export type MiniMutationResult<TInput, TOutput> = {
  mutate: (input: TInput) => void;
  mutateAsync: (input: TInput) => Promise<TOutput>;
  isLoading: boolean;
  data: TOutput | undefined;
  error: any;
  reset: () => void;
};

/**
 * Wrap a tRPC proxy client so call sites can do:
 *   trpc.evolution.shard.action.useMutation().mutateAsync(...)
 *
 * Works in Preact (no Provider, no react-query).
 */
export function createTrpcHooks<TClient extends object>(trpcClient: TClient) {
  const getAtPath = (path: (string | symbol)[]) => {
    let cur: any = trpcClient;
    for (const p of path) cur = cur?.[p as any];
    return cur;
  };

  const makeMutationHook = (path: (string | symbol)[]) => {
    const proc = getAtPath(path);
    if (!proc || typeof proc.mutate !== "function") {
      const pretty = path.map(String).join(".");
      throw new Error(
        `[trpcHooks] ${pretty} is not a mutation (missing .mutate)`,
      );
    }

    return function useMutation<
      TInput = any,
      TOutput = any,
    >(): MiniMutationResult<TInput, TOutput> {
      const [isLoading, setLoading] = useState(false);
      const [data, setData] = useState<TOutput | undefined>(undefined);
      const [error, setError] = useState<any>(undefined);

      const mountedRef = useRef(true);
      useMemo(() => {
        mountedRef.current = true;
        return () => {
          mountedRef.current = false;
        };
      }, []);

      const reset = useCallback(() => {
        if (!mountedRef.current) return;
        setLoading(false);
        setData(undefined);
        setError(undefined);
      }, []);

      const mutateAsync = useCallback(async (input: TInput) => {
        if (mountedRef.current) {
          setLoading(true);
          setError(undefined);
        }
        try {
          const res = await proc.mutate(input);
          if (mountedRef.current) setData(res);
          return res as TOutput;
        } catch (e) {
          if (mountedRef.current) setError(e);
          throw e;
        } finally {
          if (mountedRef.current) setLoading(false);
        }
      }, []);

      const mutate = useCallback(
        (input: TInput) => {
          void mutateAsync(input);
        },
        [mutateAsync],
      );

      return { mutate, mutateAsync, isLoading, data, error, reset };
    };
  };

  const makePathProxy = (path: (string | symbol)[]) =>
    new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "useMutation") return makeMutationHook(path);
          if (prop === "raw") return getAtPath(path); // optional escape hatch
          return makePathProxy([...path, prop]);
        },
      },
    );

  return new Proxy(
    {},
    {
      get(_t, prop) {
        return makePathProxy([prop]);
      },
    },
  ) as any;
}
