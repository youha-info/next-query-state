import { BatchRouterCore } from "next-batch-router/dist/cjs/BatchRouterCore";
import { firstParam } from "./utils";

// BatchRouter does not export the TransitionsOption interface,
// but we can get it from where it's used:
export type TransitionOptions = Parameters<BatchRouterCore["push"]>[2];

export type HistoryOptions = "replace" | "push";

// TODO: Use definition from next-batch-router
export type BatchRouterQueryValue = string | number | boolean | string[] | number[] | boolean[] | null;

/**
 * Parse and serializes between batch router interface and useUrlState interface.
 * T may contain null or undefined depending on Serializer.
 */
export type Serializers<T> = {
    parse: (value: string | string[] | undefined) => T;
    serialize?: (value: T) => BatchRouterQueryValue;
};

export type SerializersWithDefaultFactory<T, NoDefault = T | null> = Serializers<NoDefault> & {
    withDefault: (defaultValue: T) => Serializers<T>;
};

export type QueryTypeMap = Readonly<{
    string: SerializersWithDefaultFactory<string>;
    integer: SerializersWithDefaultFactory<number>;
    float: SerializersWithDefaultFactory<number>;
    boolean: SerializersWithDefaultFactory<boolean>;

    /**
     * Querystring encoded as the number of milliseconds since epoch,
     * and returned as a Date object.
     */
    timestamp: SerializersWithDefaultFactory<Date>;

    /**
     * Querystring encoded as an ISO-8601 string (UTC),
     * and returned as a Date object.
     */
    isoDateTime: SerializersWithDefaultFactory<Date>;

    /**
     * String-based enums provide better type-safety for known sets of values.
     * You will need to pass the stringEnum function a list of your enum values
     * in order to validate the query string. Anything else will return `null`,
     * or your default value if specified.
     *
     * Example:
     * ```ts
     * enum Direction {
     *   up = 'UP',
     *   down = 'DOWN',
     *   left = 'LEFT',
     *   right = 'RIGHT'
     * }
     *
     * const [direction, setDirection] = useQueryState(
     *   'direction',
     *   queryTypes
     *     .stringEnum<Direction>(Object.values(Direction))
     *     .withDefault(Direction.up)
     * )
     * ```
     *
     * Note: the query string value will be the value of the enum, not its name
     * (example above: `direction=UP`).
     *
     * @param validValues The values you want to accept
     */
    stringEnum<Enum extends string>(validValues: Enum[]): SerializersWithDefaultFactory<Enum>;

    /**
     * Encode any object shape into the querystring value as JSON.
     * Value is URI-encoded for safety, so it may not look nice in the URL.
     * Note: you may want to use `useQueryStates` for finer control over
     * multiple related query keys.
     */
    json<T>(): SerializersWithDefaultFactory<T>;

    /**
     * A comma-separated list of items.
     * Items are URI-encoded for safety, so they may not look nice in the URL.
     *
     * @param itemSerializers Serializers for each individual item in the array
     * @param separator The character to use to separate items (default ',')
     */
    array<ItemType>(
        itemSerializers: Serializers<ItemType>,
        separator?: string
    ): SerializersWithDefaultFactory<ItemType[]>;
}>;

export const queryTypes: QueryTypeMap = {
    string: {
        parse: (v) => (v === undefined ? null : firstParam(v)),
        withDefault(defaultValue) {
            return {
                parse: (v) => (v === undefined ? defaultValue : firstParam(v)),
            };
        },
    },
    integer: {
        parse: (v) => (v === undefined ? null : parseInt(firstParam(v))),
        serialize: (v) => (v === null ? null : Math.round(v).toFixed()),
        withDefault(defaultValue) {
            return {
                parse: (v) => (v === undefined ? defaultValue : parseInt(firstParam(v))),
                serialize: this.serialize,
            };
        },
    },
    float: {
        parse: (v) => (v === undefined ? null : parseFloat(firstParam(v))),
        serialize: (v) => (v === null ? null : v.toString()),
        withDefault(defaultValue) {
            return {
                parse: (v) => (v === undefined ? defaultValue : parseFloat(firstParam(v))),
                serialize: this.serialize,
            };
        },
    },
    boolean: {
        parse: (v) => (v === undefined ? null : v === "true"),
        serialize: (v) => (v === null ? null : v ? "true" : "false"),
        withDefault(defaultValue) {
            return {
                parse: (v) => (v === undefined ? defaultValue : v === "true"),
                serialize: this.serialize,
            };
        },
    },
    timestamp: {
        parse: (v) => (v === undefined ? null : new Date(parseInt(firstParam(v)))),
        serialize: (v) => (v === null ? null : v.valueOf().toString()),
        withDefault(defaultValue) {
            return {
                parse: (v) => (v === undefined ? defaultValue : new Date(parseInt(firstParam(v)))),
                serialize: this.serialize,
            };
        },
    },
    isoDateTime: {
        parse: (v) => (v === undefined ? null : new Date(firstParam(v))),
        serialize: (v) => (v === null ? null : v.toISOString()),
        withDefault(defaultValue) {
            return {
                parse: (v) => (v === undefined ? defaultValue : new Date(firstParam(v))),
                serialize: this.serialize,
            };
        },
    },
    stringEnum<Enum extends string>(validValues: Enum[]) {
        const parse = (v: string | string[] | undefined) => {
            if (v !== undefined) {
                const asEnum = firstParam(v) as Enum;
                if (validValues.includes(asEnum)) return asEnum;
            }
            return null;
        };
        return {
            parse,
            serialize: (value) => (value === null ? null : value.toString()),
            withDefault(defaultValue) {
                return {
                    parse: (v) => parse(v) ?? defaultValue,
                    serialize: this.serialize,
                };
            },
        };
    },
    json<T>() {
        const parse = (v: string | string[] | undefined) => {
            if (v === undefined) return null;
            try {
                return JSON.parse(firstParam(v)) as T;
            } catch {
                return null;
            }
        };
        return {
            parse,
            serialize: (value) => (value === null ? null : JSON.stringify(value)),
            withDefault(defaultValue) {
                return {
                    parse: (v) => parse(v) ?? defaultValue,
                    serialize: this.serialize,
                };
            },
        };
    },
    // TODO: check if encodeURI needed
    array(itemSerializers, separator = ",") {
        const parse = (v: string | string[] | undefined) => {
            if (v === undefined) return null;
            type ItemType = ReturnType<typeof itemSerializers.parse>;
            const parsedValues = firstParam(v)
                .split(separator)
                .map(itemSerializers.parse)
                .filter((x) => x !== null) as ItemType[];
            return parsedValues.length ? parsedValues : null;
        };
        return {
            parse,
            serialize: (v) => {
                if (v === null) return null;
                return v.map(itemSerializers.serialize || String).join(separator);
            },
            withDefault(defaultValue) {
                return {
                    parse: (v) => parse(v) ?? defaultValue,
                    serialize: this.serialize,
                };
            },
        };
    },
};
