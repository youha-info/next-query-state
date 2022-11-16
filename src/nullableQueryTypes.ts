import { NextQueryValue, Serializers, WriteQueryValue } from "./defs";
import { firstParam } from "./utils";

export type NullableSerializersWithDefaultFactory<T, NoDefault = T | undefined> = Required<
    Serializers<NoDefault, NoDefault | undefined>
> & {
    withDefault: (defaultValue: T) => Required<Serializers<T, T | undefined>>;
};

export type NullableQueryTypeMap = Readonly<{
    string: NullableSerializersWithDefaultFactory<string | null>;
    integer: NullableSerializersWithDefaultFactory<number | null>;
    float: NullableSerializersWithDefaultFactory<number | null>;
    boolean: NullableSerializersWithDefaultFactory<boolean | null>;

    /**
     * Querystring encoded as the number of milliseconds since epoch,
     * and returned as a Date object.
     */
    timestamp: NullableSerializersWithDefaultFactory<Date | null>;

    /**
     * Querystring encoded as an ISO-8601 string (UTC),
     * and returned as a Date object.
     */
    isoDateTime: NullableSerializersWithDefaultFactory<Date | null>;

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
    ): NullableSerializersWithDefaultFactory<Enum | null>;

    /**
     * Encode any object shape into the querystring value as JSON.
     * Value is URI-encoded by next.js for safety, so it may not look nice in the URL.
     * Note: you may want to use `useQueryStates` for finer control over
     * multiple related query keys.
     */
    json<T>(): NullableSerializersWithDefaultFactory<T>;

    /**
     * List of items represented with duplicate keys.
     * Items are URI-encoded by next.js for safety, so they may not look nice in the URL.
     *
     * @param itemSerializers Serializers for each individual item in the array
     */
    array<ItemType>(
        itemSerializers: Serializers<ItemType>
    ): NullableSerializersWithDefaultFactory<Exclude<ItemType, undefined>[]>;

    /**
     * A comma-separated list of items.
     * Items are URI-encoded by next.js for safety, so they may not look nice in the URL.
     *
     * @param itemSerializers Serializers for each individual item in the array
     * @param separator The character to use to separate items (default ',' which encodes into '%2C')
     */
    delimitedArray<ItemType>(
        itemSerializers: Serializers<ItemType>,
        separator?: string
    ): NullableSerializersWithDefaultFactory<Exclude<ItemType, undefined>[]>;
}>;

export const nullableQueryTypes: NullableQueryTypeMap = {
    string: {
        parse: (v) => (firstParam(v) === "\0" ? null : firstParam(v)),
        serialize: (v) => (v === undefined ? null : v === null ? "\0" : v),
        withDefault(defaultValue) {
            return {
                parse: (v) =>
                    firstParam(v) === "\0" ? null : v === undefined ? defaultValue : firstParam(v),
                serialize: this.serialize,
            };
        },
    },
    integer: {
        parse: (v) => (firstParam(v) === "\0" ? null : parseFlooredFloatOrUndef(v)),
        serialize: (v) => (v === undefined ? null : v === null ? "\0" : Math.floor(v).toFixed()),
        withDefault(defaultValue) {
            return {
                parse: (v) =>
                    firstParam(v) === "\0" ? null : parseFlooredFloatOrUndef(v) ?? defaultValue,
                serialize: this.serialize,
            };
        },
    },
    float: {
        parse: (v) => (firstParam(v) === "\0" ? null : parseFloatOrUndef(v)),
        serialize: (v) => (v === undefined ? null : v === null ? "\0" : v.toString()),
        withDefault(defaultValue) {
            return {
                parse: (v) =>
                    firstParam(v) === "\0" ? null : parseFloatOrUndef(v) ?? defaultValue,
                serialize: this.serialize,
            };
        },
    },
    boolean: {
        parse: (v) => (firstParam(v) === "\0" ? null : parseBooleanOrUndef(v)),
        serialize: (v) => (v === undefined ? null : v === null ? "\0" : v ? "true" : "false"),
        withDefault(defaultValue) {
            return {
                parse: (v) =>
                    firstParam(v) === "\0" ? null : parseBooleanOrUndef(v) ?? defaultValue,
                serialize: this.serialize,
            };
        },
    },
    timestamp: {
        parse: (v) => (firstParam(v) === "\0" ? null : parseTimestampOrUndef(v)),
        serialize: (v) =>
            v === undefined
                ? null
                : v === null
                ? "\0"
                : isNaN(v.valueOf())
                ? null
                : v.valueOf().toString(),
        withDefault(defaultValue) {
            return {
                parse: (v) =>
                    firstParam(v) === "\0" ? null : parseTimestampOrUndef(v) ?? defaultValue,
                serialize: this.serialize,
            };
        },
    },
    isoDateTime: {
        parse: (v) => (firstParam(v) === "\0" ? null : parseIsoDateTimeOrUndef(v)),
        serialize: (v) =>
            v === undefined
                ? null
                : v === null
                ? "\0"
                : isNaN(v.valueOf())
                ? null
                : v.toISOString(),
        withDefault(defaultValue) {
            return {
                parse: (v) =>
                    firstParam(v) === "\0" ? null : parseIsoDateTimeOrUndef(v) ?? defaultValue,
                serialize: this.serialize,
            };
        },
    },
    stringEnum<Enum extends string>(validValues: Enum[]) {
        const parse = (v: string | string[] | undefined) => {
            const val = firstParam(v);
            if (val === "\0") return null;
            if (val !== undefined) {
                const asEnum = firstParam(v) as Enum;
                if (validValues.includes(asEnum)) return asEnum;
            }
            return undefined;
        };
        return {
            parse,
            serialize: (value) =>
                value === undefined ? null : value === null ? "\0" : value.toString(),
            withDefault(defaultValue) {
                return {
                    parse: (v) => {
                        const value = parse(v);
                        return value === undefined ? defaultValue : value;
                    },
                    serialize: this.serialize,
                };
            },
        };
    },
    json<T>() {
        const parse = (v: NextQueryValue) => {
            if (v === undefined) return undefined;
            try {
                // null is represented with string "null"
                return JSON.parse(firstParam(v)) as T;
            } catch {
                return undefined;
            }
        };
        return {
            parse,
            serialize: (v) =>
                // null is represented with string "null"
                (v === undefined ? null : JSON.stringify(v)) as string | null | undefined,
            withDefault(defaultValue) {
                return {
                    parse: (v) => {
                        const parsed = parse(v);
                        return parsed === undefined ? defaultValue : parsed;
                    },
                    serialize: this.serialize,
                };
            },
        };
    },
    array(itemSerializers) {
        const parse = (v: string | string[] | undefined) => {
            if (v === undefined) return undefined;
            type ItemType = ReturnType<typeof itemSerializers.parse>;
            const arr = Array.isArray(v) ? v : [v];
            const parsedValues = arr
                .map(itemSerializers.parse)
                .filter((x) => x !== undefined) as Exclude<ItemType, undefined>[];
            return parsedValues.length ? parsedValues : undefined;
        };
        return {
            parse,
            serialize: (v) => {
                if (v === undefined) return null;
                return v
                    .map(itemSerializers.serialize || String)
                    .filter((v) => v != null) as WriteQueryValue;
            },
            withDefault(defaultValue) {
                return {
                    parse: (v) => {
                        const value = parse(v);
                        return value === undefined ? defaultValue : value;
                    },
                    serialize: this.serialize,
                };
            },
        };
    },
    delimitedArray(itemSerializers, separator = ",") {
        const parse = (v: string | string[] | undefined) => {
            if (v === undefined) return undefined;
            type ItemType = ReturnType<typeof itemSerializers.parse>;
            const parsedValues = firstParam(v)
                .split(separator)
                .map(itemSerializers.parse)
                .filter((x) => x !== undefined) as Exclude<ItemType, undefined>[];
            return parsedValues.length ? parsedValues : undefined;
        };
        return {
            parse,
            serialize: (v) => {
                if (v === undefined || v.length === 0) return null;
                return v.map(itemSerializers.serialize || String).join(separator);
            },
            withDefault(defaultValue) {
                return {
                    parse: (v) => {
                        const value = parse(v);
                        return value === undefined ? defaultValue : value;
                    },
                    serialize: this.serialize,
                };
            },
        };
    },
};

function parseFlooredFloatOrUndef(v: string | string[] | undefined) {
    if (v === undefined) return undefined;
    const parsed = parseFloat(firstParam(v));
    return isNaN(parsed) ? undefined : Math.floor(parsed);
}

function parseFloatOrUndef(v: string | string[] | undefined) {
    if (v === undefined) return undefined;
    const parsed = parseFloat(firstParam(v));
    return isNaN(parsed) ? undefined : parsed;
}

function parseBooleanOrUndef(v: string | string[] | undefined) {
    if (v === undefined) return undefined;
    const first = firstParam(v);
    if (first.toLowerCase() === "true") return true;
    if (first.toLowerCase() === "false") return false;
    return undefined;
}

function parseTimestampOrUndef(v: string | string[] | undefined) {
    const timestamp = parseFlooredFloatOrUndef(v);
    if (timestamp === undefined) return undefined;
    const dt = new Date(timestamp);
    return isNaN(dt.valueOf()) ? undefined : dt;
}

function parseIsoDateTimeOrUndef(v: string | string[] | undefined) {
    if (v === undefined) return undefined;
    const dt = new Date(firstParam(v));
    return isNaN(dt.valueOf()) ? undefined : dt;
}
