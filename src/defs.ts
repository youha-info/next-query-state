import { BatchRouterTypes } from "next-batch-router";
import { defaultSerializer, firstParam } from "./utils";

export type TransitionOptions = BatchRouterTypes.TransitionOptions;
export type HistoryOptions = "replace" | "push";
export type UpdateOptions = { history?: HistoryOptions } & TransitionOptions;
export type NextQueryValue = BatchRouterTypes.NextQueryValue;
export type WriteQueryValue = BatchRouterTypes.WriteQueryValue;

/**
 * Parse and serializes between batch router interface and useQueryState interface.
 * T may contain null or undefined depending on Serializer.
 */
export type Serializers<T, WT = T> = {
    parse: (value: NextQueryValue) => T;
    serialize?: (value: WT) => WriteQueryValue;
};

export type SerializersWithDefaultFactory<T, NoDefault = T | null> = Required<
    Serializers<NoDefault, NoDefault | null | undefined>
> & {
    withDefault: (defaultValue: T) => Serializers<T, T | null | undefined>;
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
    stringEnum<Enum extends string>(
        validValues: Enum[] | readonly Enum[]
    ): SerializersWithDefaultFactory<Enum>;

    /**
     * Encode any object shape into the querystring value as JSON.
     * Value is URI-encoded by next.js for safety, so it may not look nice in the URL.
     * Note: you may want to use `useQueryStates` for finer control over
     * multiple related query keys.
     */
    json<T>(): SerializersWithDefaultFactory<T>;

    /**
     * List of items represented with duplicate keys.
     * Items are URI-encoded for safety, so they may not look nice in the URL.
     *
     * @param itemSerializers Serializers for each individual item in the array
     */
    array<ItemType>(
        itemSerializers: Serializers<ItemType>
    ): SerializersWithDefaultFactory<Exclude<ItemType, null>[]>;

    /**
     * A comma-separated list of items.
     * Items are URI-encoded for safety, so they may not look nice in the URL.
     *
     * @param itemSerializers Serializers for each individual item in the array
     * @param separator The character to use to separate items (default ',')
     */
    delimitedArray<ItemType>(
        itemSerializers: Serializers<ItemType>,
        separator?: string
    ): SerializersWithDefaultFactory<Exclude<ItemType, null>[]>;
}>;

export const queryTypes: QueryTypeMap = {
    string: {
        parse: (v) => (v === undefined ? null : firstParam(v)),
        serialize: (v) => v,
        withDefault(defaultValue) {
            return {
                parse: (v) => (v === undefined ? defaultValue : firstParam(v)),
            };
        },
    },
    integer: {
        parse: parseFlooredFloatOrNull,
        serialize: (v) => (v == null ? v : Math.floor(v).toFixed()),
        withDefault(defaultValue) {
            return {
                parse: (v) => parseFlooredFloatOrNull(v) ?? defaultValue,
                serialize: this.serialize,
            };
        },
    },
    float: {
        parse: parseFloatOrNull,
        serialize: (v) => (v == null ? v : v.toString()),
        withDefault(defaultValue) {
            return {
                parse: (v) => parseFloatOrNull(v) ?? defaultValue,
                serialize: this.serialize,
            };
        },
    },
    boolean: {
        parse: parseBooleanOrNull,
        serialize: (v) => (v == null ? v : v ? "true" : "false"),
        withDefault(defaultValue) {
            return {
                parse: (v) => parseBooleanOrNull(v) ?? defaultValue,
                serialize: this.serialize,
            };
        },
    },
    timestamp: {
        parse: parseTimestampOrNull,
        serialize: (v) => (v == null ? v : isNaN(v.valueOf()) ? null : v.valueOf().toString()),
        withDefault(defaultValue) {
            return {
                parse: (v) => parseTimestampOrNull(v) ?? defaultValue,
                serialize: this.serialize,
            };
        },
    },
    isoDateTime: {
        parse: parseIsoDateTimeOrNull,
        serialize: (v) => (v == null ? v : isNaN(v.valueOf()) ? null : v.toISOString()),
        withDefault(defaultValue) {
            return {
                parse: (v) => parseIsoDateTimeOrNull(v) ?? defaultValue,
                serialize: this.serialize,
            };
        },
    },
    stringEnum<Enum extends string>(validValues: Enum[]) {
        const parse = (v: NextQueryValue) => {
            if (v !== undefined) {
                const asEnum = firstParam(v) as Enum;
                if (validValues.includes(asEnum)) return asEnum;
            }
            return null;
        };
        return {
            parse,
            serialize: (v) => (v == null ? v : v.toString()),
            withDefault(defaultValue) {
                return {
                    parse: (v) => parse(v) ?? defaultValue,
                    serialize: this.serialize,
                };
            },
        };
    },
    json<T>() {
        const parse = (v: NextQueryValue) => {
            if (v === undefined) return null;
            try {
                return JSON.parse(firstParam(v)) as T;
            } catch {
                return null;
            }
        };
        return {
            parse,
            serialize: (v) => (v == null ? v : JSON.stringify(v)) as string | null | undefined,
            withDefault(defaultValue) {
                return {
                    parse: (v) => parse(v) ?? defaultValue,
                    serialize: this.serialize,
                };
            },
        };
    },
    array(itemSerializers) {
        const parse = (v: NextQueryValue) => {
            if (v === undefined) return null;
            type ItemType = ReturnType<typeof itemSerializers.parse>;
            const arr = Array.isArray(v) ? v : [v];
            const parsedValues = arr
                .map(itemSerializers.parse)
                .filter((x) => x !== null) as Exclude<ItemType, null>[];
            return parsedValues.length ? parsedValues : null;
        };
        return {
            parse,
            serialize: (v) => {
                if (v == null) return v;
                return v
                    .map(itemSerializers.serialize || String)
                    .filter((v) => v != null) as WriteQueryValue;
            },
            withDefault(defaultValue) {
                return {
                    parse: (v) => parse(v) ?? defaultValue,
                    serialize: this.serialize,
                };
            },
        };
    },
    delimitedArray(itemSerializers, separator = ",") {
        const parse = (v: NextQueryValue) => {
            if (v === undefined) return null;
            type ItemType = ReturnType<typeof itemSerializers.parse>;
            const parsedValues = firstParam(v)
                .split(separator)
                .map(itemSerializers.parse)
                .filter((x) => x !== null) as Exclude<ItemType, null>[];
            return parsedValues.length ? parsedValues : null;
        };
        return {
            parse,
            serialize: (v) => {
                if (v == null) return v;
                if (v.length === 0) return null;
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

function parseFlooredFloatOrNull(v: string | string[] | undefined) {
    if (v === undefined) return null;
    const parsed = parseFloat(firstParam(v));
    return isNaN(parsed) ? null : Math.floor(parsed);
}

function parseFloatOrNull(v: string | string[] | undefined) {
    if (v === undefined) return null;
    const parsed = parseFloat(firstParam(v));
    return isNaN(parsed) ? null : parsed;
}

function parseBooleanOrNull(v: string | string[] | undefined) {
    if (v === undefined) return null;
    const first = firstParam(v);
    if (first.toLowerCase() === "true") return true;
    if (first.toLowerCase() === "false") return false;
    return null;
}

function parseTimestampOrNull(v: string | string[] | undefined) {
    const timestamp = parseFlooredFloatOrNull(v);
    if (timestamp === null) return null;
    const dt = new Date(timestamp);
    return isNaN(dt.valueOf()) ? null : dt;
}

function parseIsoDateTimeOrNull(v: string | string[] | undefined) {
    if (v === undefined) return null;
    const dt = new Date(firstParam(v));
    return isNaN(dt.valueOf()) ? null : dt;
}
