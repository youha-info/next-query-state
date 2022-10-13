import { Serializers } from "./defs";
import { firstParam } from "./utils";

export type NullableSerializersWithDefaultFactory<
    T,
    NoDefault = T | undefined
> = Serializers<NoDefault> & {
    withDefault: (defaultValue: T) => Serializers<T>;
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
        validValues: Enum[]
    ): NullableSerializersWithDefaultFactory<Enum | null>;

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
    ): NullableSerializersWithDefaultFactory<ItemType[] | null>;
}>;

export const nullableQueryTypes: NullableQueryTypeMap = {
    string: {
        parse: (v) => (v === "\0" ? null : firstParam(v)),
        serialize: (v) => (v === undefined ? null : v === null ? "\0" : v),
        withDefault(defaultValue) {
            return {
                parse: (v) => (v === undefined ? defaultValue : firstParam(v)),
                serialize: this.serialize
            };
        },
    },
    integer: {
        parse: (v) => (v === undefined ? undefined : v === "\0" ? null : parseInt(firstParam(v))),
        serialize: (v) => (v === undefined ? null : v === null ? "\0" : Math.round(v).toFixed()),
        withDefault(defaultValue) {
            return {
                parse: (v) =>
                    v === undefined ? defaultValue : v === "\0" ? null : parseInt(firstParam(v)),
                serialize: this.serialize,
            };
        },
    },
    float: {
        parse: (v) => (v === undefined ? undefined : v === "\0" ? null : parseFloat(firstParam(v))),
        serialize: (v) => (v === undefined ? null : v === null ? "\0" : v.toString()),
        withDefault(defaultValue) {
            return {
                parse: (v) =>
                    v === undefined ? defaultValue : v === "\0" ? null : parseFloat(firstParam(v)),
                serialize: this.serialize,
            };
        },
    },
    boolean: {
        parse: (v) => (v === undefined ? undefined : v === "\0" ? null : v === "true"),
        serialize: (v) => (v === undefined ? null : v === null ? "\0" : v ? "true" : "false"),
        withDefault(defaultValue) {
            return {
                parse: (v) => (v === undefined ? defaultValue : v === "\0" ? null : v === "true"),
                serialize: this.serialize,
            };
        },
    },
    timestamp: {
        parse: (v) =>
            v === undefined ? undefined : v === "\0" ? null : new Date(parseInt(firstParam(v))),
        serialize: (v) => (v === undefined ? null : v === null ? "\0" : v.valueOf().toString()),
        withDefault(defaultValue) {
            return {
                parse: (v) =>
                    v === undefined
                        ? defaultValue
                        : v === "\0"
                        ? null
                        : new Date(parseInt(firstParam(v))),
                serialize: this.serialize,
            };
        },
    },
    isoDateTime: {
        parse: (v) => (v === undefined ? undefined : v === "\0" ? null : new Date(firstParam(v))),
        serialize: (v) => (v === undefined ? null : v === null ? "\0" : v.toISOString()),
        withDefault(defaultValue) {
            return {
                parse: (v) =>
                    v === undefined ? defaultValue : v === "\0" ? null : new Date(firstParam(v)),
                serialize: this.serialize,
            };
        },
    },
    stringEnum<Enum extends string>(validValues: Enum[]) {
        const parse = (v: string | string[] | undefined) => {
            if (v === "\0") return null;
            if (v !== undefined) {
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
    array(itemSerializers, separator = ",") {
        const parse = (v: string | string[] | undefined) => {
            if (v === undefined) return undefined;
            if (v === "\0") return null;
            type ItemType = ReturnType<typeof itemSerializers.parse>;
            const parsedValues = firstParam(v)
                .split(separator)
                .map(itemSerializers.parse)
                .filter((x) => x !== undefined) as ItemType[];
            return parsedValues.length ? parsedValues : undefined;
        };
        return {
            parse,
            serialize: (v) => {
                if (v === undefined) return null;
                if (v === null) return "\0";
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
