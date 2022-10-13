import { useBatchRouter } from "next-batch-router";
import { useRouter } from "next/router";
import type { BatchRouterQueryValue, HistoryOptions, Serializers, TransitionOptions } from "./defs";
import { defaultSerializer } from "./utils";

export type UseQueryStatesKeyMap<KeyMap = any> = {
    [Key in keyof KeyMap]: Serializers<KeyMap[Key]>;
};

export interface UseQueryStatesOptions {
    /**
     * The operation to use on state updates. Defaults to `replace`.
     */
    history: HistoryOptions;
}

export type Values<T extends UseQueryStatesKeyMap> = {
    [K in keyof T]: ReturnType<T[K]["parse"]>;
};

type UpdaterFn<T extends UseQueryStatesKeyMap> = (old: Values<T>) => Partial<Values<T>>;

export type SetValues<T extends UseQueryStatesKeyMap> = (
    stateUpdater: Partial<Values<T>> | UpdaterFn<T>,
    options?: { history: HistoryOptions },
    transitionOptions?: TransitionOptions
) => void;

export type UseQueryStatesReturn<T extends UseQueryStatesKeyMap> = [Values<T>, SetValues<T>];

/**
 * Synchronise multiple query string arguments to React state in Next.js
 *
 * WARNING: This function is not optimized. No memoization happens inside.
 * This function is intended to be used for cases like below.
 * 1. The keys are changed at runtime. (Since conditional use of useQueryState is illegal)
 * 2. New value is determined by multiple keys while doing functional update.
 *
 * @param keys - An object describing the keys to synchronise and how to
 *               serialise and parse them.
 *               Use `queryTypes.(string|integer|float)` for quick shorthands.
 */
export function useQueryStates<KeyMap extends UseQueryStatesKeyMap>(
    keys: KeyMap,
    { history = "replace" }: Partial<UseQueryStatesOptions> = {}
): UseQueryStatesReturn<KeyMap> {
    const router = useRouter();
    const batchRouter = useBatchRouter();

    type V = Values<KeyMap>;

    // Parse query into values
    const values: V = {} as V;
    for (const key of Object.keys(keys))
        values[key as keyof V] = keys[key].parse(router.query[key]);

    /** Serialize values object */
    const serialize = (vals: Partial<V>) => {
        const serialized: Record<string, BatchRouterQueryValue> = {};
        for (const key of Object.keys(keys))
            if (key in vals) serialized[key] = (keys[key].serialize || defaultSerializer)(vals);
        return serialized;
    };

    // Update function
    const update: SetValues<KeyMap> = (stateUpdater, options, transitionOptions) => {
        const queryUpdater = isUpdaterFunction<KeyMap>(stateUpdater)
            ? (query: Record<string, BatchRouterQueryValue | undefined>) => {
                  const prev: V = {} as V;
                  for (const key of Object.keys(keys)) {
                      const val = query[key];
                      const stringVal = Array.isArray(val) ? val!.map(String) : String(val);
                      prev[key as keyof V] = keys[key].parse(stringVal);
                  }
                  const updated = stateUpdater(prev);
                  return { ...query, ...serialize(updated) };
              }
            : serialize(stateUpdater);
        const historyMode = options?.history || history;
        if (historyMode === "push")
            return batchRouter.push({ query: queryUpdater }, undefined, transitionOptions);
        else return batchRouter.replace({ query: queryUpdater }, undefined, transitionOptions);
    };

    return [values, update];
}


function isUpdaterFunction<KeyMap extends UseQueryStatesKeyMap>(
    input: any
): input is UpdaterFn<KeyMap> {
    return typeof input === "function";
}
