import { useBatchRouter } from "next-batch-router";
import { useRouter } from "next/router";
import React from "react";
import { BatchRouterQueryValue, HistoryOptions, Serializers, TransitionOptions } from "./defs";
import { defaultSerializer } from "./utils";

export interface UseUrlStateOptions<T> extends Serializers<T> {
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
}

export type SetUrlStateOptions = {
    history?: HistoryOptions;
};

export type UseUrlStateReturn<T> = [
    T,
    (
        value: T | ((prev: T) => T),
        options?: SetUrlStateOptions,
        transitionOptions?: TransitionOptions
    ) => void
];

/** Variation with no parser, serializer.
 * Uses default serializer of type `string | string[] | null`
 */
export function useUrlState(
    key: string,
    options?: { history?: HistoryOptions; dynamic?: boolean }
): UseUrlStateReturn<string | string[] | null>;
export function useUrlState<T>(key: string, options: UseUrlStateOptions<T>): UseUrlStateReturn<T>;
export function useUrlState<T>(
    key: string,
    {
        history = "replace",
        dynamic = false,
        parse = (x) => (x === undefined ? null : x) as T,
        serialize = defaultSerializer,
    }: Partial<UseUrlStateOptions<T>> = {}
): UseUrlStateReturn<T> {
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
            stateUpdater: T | ((prev: T) => T),
            options?: SetUrlStateOptions,
            transitionOptions?: TransitionOptions
        ) => {
            const queryUpdater = isUpdaterFunction(stateUpdater)
                ? (query: Record<string, BatchRouterQueryValue | undefined>) => {
                      const prev = query[key];
                      // Turn BatchRouterQueryValue into string | string[] | undefined to be put into parse.
                      const prevString = Array.isArray(prev) ? prev!.map(String) : String(prev);
                      return {
                          ...query,
                          [key]: serialize(stateUpdater(parse(prevString))),
                      };
                  }
                : { [key]: serialize(stateUpdater) };

            const historyMode = options?.history || history;
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

function isUpdaterFunction<T>(input: T | ((prev: T) => T)): input is (prev: T) => T {
    return typeof input === "function";
}
