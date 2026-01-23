// sigil/util/trpcHooks.ts
import { useCallback, useMemo, useRef, useState } from "preact/hooks";

export type MiniMutationResult<TInput, TOutput> = {
  mutate: (input: TInput) => void;
  mutateAsync: (input: TInput) => Promise<TOutput>;
  isLoading: boolean;
  data: TOutput | undefined;
  error: any;
  reset: () => void;
};

type TrpcBase = {
  query: (path: string, input?: unknown) => Promise<any>;
  mutation: (path: string, input?: unknown) => Promise<any>;
};

export function createTrpcHooks(base: TrpcBase, opts?: { logging?: boolean }) {
  const logging = !!opts?.logging;

  const makeMutationHook = (pathStr: string) => {
    return function useMutation<
      TInput = any,
      TOutput = any,
    >(): MiniMutationResult<TInput, TOutput> {
      const [isLoading, setLoading] = useState(false);
      const [data, setData] = useState<TOutput | undefined>(undefined);
      const [error, setError] = useState<any>(undefined);

      const mountedRef = useRef(true);
      useMemo(() => () => void (mountedRef.current = false), []);

      const reset = useCallback(() => {
        if (!mountedRef.current) return;
        setLoading(false);
        setData(undefined);
        setError(undefined);
      }, []);

      const mutateAsync = useCallback(
        async (input: TInput) => {
          if (logging) console.info("[trpcHooks] mutateAsync", pathStr, input);
          if (mountedRef.current) {
            setLoading(true);
            setError(undefined);
          }
          try {
            const res = await base.mutation(pathStr, input);
            if (mountedRef.current) setData(res);
            return res as TOutput;
          } catch (e) {
            if (mountedRef.current) setError(e);
            throw e;
          } finally {
            if (mountedRef.current) setLoading(false);
          }
        },
        [pathStr],
      );

      const mutate = useCallback(
        (input: TInput) => void mutateAsync(input),
        [mutateAsync],
      );

      return { mutate, mutateAsync, isLoading, data, error, reset };
    };
  };

  const mk = (parts: (string | symbol)[]): any =>
    new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "then") return undefined;

          const pathStr = parts.map(String).join(".");

          if (prop === "useMutation") return makeMutationHook(pathStr);

          // imperative terminals
          if (prop === "mutate" || prop === "mutateAsync") {
            return (input?: any) => base.mutation(pathStr, input);
          }
          if (prop === "query") {
            return (input?: any) => base.query(pathStr, input);
          }

          return mk([...parts, prop]);
        },
      },
    );

  return mk([]);
}
