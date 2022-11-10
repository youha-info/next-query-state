import { useBatchRouter } from "next-batch-router";
import { useRouter } from "next/router";
import React from "react";
import { HistoryOptions, NextQueryValue, Serializers, UpdateOptions } from "./defs";
import { defaultSerializer, firstStringParser } from "./utils";

type UseQueryStateOptions = {
    /**
     * The operation to use on state updates. Defaults to `replace`.
     */
    history?: HistoryOptions;
    /**
     * Sets if parse and serialize functions can be changed in runtime.
     * Parse and serialize functions must not be changed unless dynamic is set to true.
     * Defaults to false.
     *
     * If set to true, referential equality of the functions must be managed via useCallback or by other means.
     * Value and updater functions are dependent on them, and only the recent updater function must be used.
     * Stale updater functions use previously supplied parse and serialize functions,
     * which might have different types or different default values.
     */
    dynamic?: boolean;
};

type UseQueryStateReturn<T, WT> = [
    T,
    (value: WT | ((prev: T) => WT), options?: UpdateOptions) => Promise<boolean | undefined>
];

/**
 * Hook similar to useState but stores state in the URL query string.
 *
 * If serializers are not supplied, returns the first string value of the query param with the key.
 * Update function set the URL with string | string[] | null.
 */
export function useQueryState(
    key: string
): UseQueryStateReturn<string | null, string | string[] | null | undefined>;
/**
 * Hook similar to useState but stores state in the URL query string.
 *
 * @param key Key to use in the query string.
 * @param serializers Object that consists of `parse` and `serialize` functions that transforms the state from and to the URL string.
 * @param options Defines history mode and dynamic serializer option.
 */
export function useQueryState<T, WT>(
    key: string,
    serializers?: Serializers<T, WT>,
    options?: UseQueryStateOptions
): UseQueryStateReturn<T, WT>;
export function useQueryState<T, WT>(
    key: string,
    {
        parse = firstStringParser as unknown as (v: any) => T,
        serialize = defaultSerializer,
    }: Partial<Serializers<T, WT>> & UseQueryStateOptions = {},
    { history = "replace", dynamic = false }: UseQueryStateOptions = {}
): UseQueryStateReturn<T, WT> {
    const router = useRouter();
    const batchRouter = useBatchRouter();

    const routerValue = router.query[key];
    const value = React.useMemo(
        () => parse(routerValue),
        // Dependency array must be consistent.
        // If dynamic is false, set parse, serialize dependency as null so function instance change doesn't update callback.
        [
            Array.isArray(routerValue) ? routerValue.join("|") : routerValue,
            ...(dynamic ? [parse, serialize] : [null, null]),
        ]
    );

    const update = React.useCallback(
        (
            stateUpdater: WT | ((prev: T) => WT),
            { history: historyOverride, ...transitionOptions }: UpdateOptions = {}
        ) => {
            const queryUpdater = isUpdaterFunction(stateUpdater)
                ? (prevObj: Record<string, NextQueryValue>) => {
                      const newVal = serialize(stateUpdater(parse(prevObj[key])));
                      // Manually merge. Keep prev value if new is undefined.
                      if (newVal !== undefined) return { ...prevObj, [key]: newVal };
                      return prevObj;
                  }
                : { [key]: serialize(stateUpdater) };

            const historyMode = historyOverride || history;
            if (historyMode === "push")
                return batchRouter.push({ query: queryUpdater }, undefined, transitionOptions);
            else return batchRouter.replace({ query: queryUpdater }, undefined, transitionOptions);
        },
        // Dependency array must be consistent.
        // If dynamic is false, set parse, serialize dependency as null so function instance change doesn't update callback.
        [key, history, batchRouter, ...(dynamic ? [parse, serialize] : [null, null])]
    );
    return [value, update];
}

function isUpdaterFunction<T, WT>(input: WT | ((prev: T) => WT)): input is (prev: T) => WT {
    return typeof input === "function";
}
