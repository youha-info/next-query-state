import { useBatchRouter } from "next-batch-router";
import { useRouter } from "next/router";
import type {
    HistoryOptions,
    NextQueryValue,
    Serializers,
    UpdateOptions,
    WriteQueryValue,
} from "./defs";
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

export type WriteValues<T extends UseQueryStatesKeyMap> = {
    [K in keyof T]: T[K]["serialize"] extends Function ? Parameters<T[K]["serialize"]>[0] : any;
};

type UpdaterFn<T extends UseQueryStatesKeyMap> = (old: Values<T>) => Partial<WriteValues<T>>;

export type SetValues<T extends UseQueryStatesKeyMap> = (
    stateUpdater: Partial<Values<T>> | UpdaterFn<T>,
    options?: UpdateOptions
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

    // Parse query into values
    const values = parseObject(router.query, keys);

    // Update function
    const update: SetValues<KeyMap> = (
        stateUpdater,
        { history: historyOverride, ...transitionOptions } = {}
    ) => {
        const queryUpdater = isUpdaterFunction<KeyMap>(stateUpdater)
            ? (prevObj: Record<string, NextQueryValue>) => {
                  const prev = parseObject(prevObj, keys);
                  const updated = stateUpdater(prev);
                  return { ...prevObj, ...serializeAndRemoveUndefined(updated, keys) };
              }
            : serializeAndRemoveUndefined(stateUpdater, keys);
        const historyMode = historyOverride || history;
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

function parseObject<KeyMap extends UseQueryStatesKeyMap>(
    query: Record<string, NextQueryValue>,
    keys: KeyMap
) {
    type V = Values<KeyMap>;
    const values: V = {} as V;
    for (const [k, v] of Object.entries(keys)) values[k as keyof V] = v.parse(query[k]);
    return values;
}

function serializeAndRemoveUndefined<KeyMap extends UseQueryStatesKeyMap>(
    vals: Partial<Values<KeyMap>>,
    keys: KeyMap
) {
    const serialized: Record<string, WriteQueryValue> = {};
    for (const [k, v] of Object.entries(keys))
        if (k in vals) {
            const serializedVal = (v.serialize || defaultSerializer)(vals);
            if (serializedVal !== undefined) serialized[k] = serializedVal;
        }

    return serialized;
}
