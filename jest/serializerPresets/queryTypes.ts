import { describe, expect, test } from "@jest/globals";
import { queryTypes, useQueryState } from "../../src";

function generateTests<T extends (...args: any) => any>(
    fn: T,
    scenarios: [Parameters<T>[0], ReturnType<T>][]
) {
    for (const [input, output] of scenarios)
        test(`${JSON.stringify(input)} -> ${JSON.stringify(output)}`, () =>
            expect(fn(input)).toEqual(output));
}

describe("queryTypes", () => {
    describe("string.parse", () =>
        generateTests(queryTypes.string.parse, [
            ["foo", "foo"],
            ["", ""],
            [["foo", "bar"], "foo"],
            [undefined, null],
        ]));
    describe("string.withDefault.parse", () =>
        generateTests(queryTypes.string.withDefault("default").parse, [
            ["foo", "foo"],
            ["", ""],
            [["foo", "bar"], "foo"],
            [undefined, "default"],
        ]));
    describe("string.serialize", () =>
        generateTests(queryTypes.string.serialize, [
            ["foo", "foo"],
            ["", ""],
            [null, null],
            [undefined, undefined],
        ]));

    describe("integer.parse", () =>
        generateTests(queryTypes.integer.parse, [
            ["123", 123],
            ["-123", -123],
            ["123.2", 123],
            ["123.8", 123],
            ["-123.2", -124],
            [".123", 0],
            [["123", "456"], 123],
            [["", "456"], null],
            ["foo", null],
            ["NaN", null],
            ["Infinity", Infinity],
            ["-Infinity", -Infinity],
            [undefined, null],
        ]));
    describe("integer.withDefault.parse", () =>
        generateTests(queryTypes.integer.withDefault(9999).parse, [
            ["123", 123],
            ["-123", -123],
            ["123.2", 123],
            ["123.8", 123],
            ["-123.2", -124],
            [".123", 0],
            [["123", "456"], 123],
            [["", "456"], 9999],
            ["foo", 9999],
            ["NaN", 9999],
            ["Infinity", Infinity],
            ["-Infinity", -Infinity],
            [undefined, 9999],
        ]));
    describe("integer.serialize", () =>
        generateTests(queryTypes.integer.serialize, [
            [123, "123"],
            [123.2, "123"],
            [123.8, "123"],
            [Infinity, "Infinity"],
            [NaN, "NaN"],
            [null, null],
            [undefined, undefined],
        ]));

    describe("float.parse", () =>
        generateTests(queryTypes.float.parse, [
            ["123", 123],
            ["-123", -123],
            ["123.2", 123.2],
            [".123", 0.123],
            [["123", "456"], 123],
            [["", "456"], null],
            ["foo", null],
            ["NaN", null],
            ["Infinity", Infinity],
            ["-Infinity", -Infinity],
            [undefined, null],
        ]));
    describe("float.withDefault.parse", () =>
        generateTests(queryTypes.float.withDefault(99.99).parse, [
            ["123", 123],
            ["-123", -123],
            ["123.2", 123.2],
            [".123", 0.123],
            [["123", "456"], 123],
            [["", "456"], 99.99],
            ["foo", 99.99],
            ["NaN", 99.99],
            ["Infinity", Infinity],
            ["-Infinity", -Infinity],
            [undefined, 99.99],
        ]));
    describe("integer.serialize", () =>
        generateTests(queryTypes.float.serialize, [
            [123, "123"],
            [123.2, "123.2"],
            [Infinity, "Infinity"],
            [NaN, "NaN"],
            [null, null],
            [undefined, undefined],
        ]));

    describe("boolean.parse", () =>
        generateTests(queryTypes.boolean.parse, [
            ["true", true],
            ["TRUE", true],
            ["tRue", true],
            ["false", false],
            ["FALSE", false],
            ["fAlse", false],
            ["T", null],
            ["", null],
            [undefined, null],
        ]));
    describe("boolean.withDefault.parse", () =>
        generateTests(queryTypes.boolean.withDefault(false).parse, [
            ["true", true],
            ["TRUE", true],
            ["tRue", true],
            ["false", false],
            ["FALSE", false],
            ["fAlse", false],
            ["T", false],
            ["", false],
            [undefined, false],
        ]));
    describe("boolean.serialize", () =>
        generateTests(queryTypes.boolean.serialize, [
            [true, "true"],
            [false, "false"],
            [null, null],
            [undefined, undefined],
        ]));

    describe("timestamp.parse", () =>
        generateTests(queryTypes.timestamp.parse, [
            ["1668493407000", new Date(1668493407000)],
            ["foo", null],
            ["Infinity", null],
            [undefined, null],
        ]));
    describe("timestamp.withDefault.parse", () =>
        generateTests(queryTypes.timestamp.withDefault(new Date(1660000000000)).parse, [
            ["1668493407000", new Date(1668493407000)],
            ["foo", new Date(1660000000000)],
            ["Infinity", new Date(1660000000000)],
            [undefined, new Date(1660000000000)],
        ]));
    describe("timestamp.serialize", () =>
        generateTests(queryTypes.timestamp.serialize, [
            [new Date(1668493407000), "1668493407000"],
            [new Date(NaN), null],
            [null, null],
            [undefined, undefined],
        ]));

    describe("isoDateTime.parse", () =>
        generateTests(queryTypes.isoDateTime.parse, [
            ["2022-11-15T06:23:27.000Z", new Date(1668493407000)],
            ["foo", null],
            ["Infinity", null],
            [undefined, null],
        ]));
    describe("isoDateTime.withDefault.parse", () =>
        generateTests(queryTypes.isoDateTime.withDefault(new Date(1660000000000)).parse, [
            ["2022-11-15T06:23:27.000Z", new Date(1668493407000)],
            ["foo", new Date(1660000000000)],
            ["Infinity", new Date(1660000000000)],
            [undefined, new Date(1660000000000)],
        ]));
    describe("isoDateTime.serialize", () =>
        generateTests(queryTypes.isoDateTime.serialize, [
            [new Date(1668493407000), "2022-11-15T06:23:27.000Z"],
            [new Date(NaN), null],
            [null, null],
            [undefined, undefined],
        ]));

    describe("stringEnum.parse", () =>
        generateTests(queryTypes.stringEnum(["foo", "bar"]).parse, [
            ["foo", "foo"],
            ["bar", "bar"],
            ["asdf", null],
            ["", null],
            [undefined, null],
        ]));
    describe("stringEnum.withDefault.parse", () =>
        generateTests(queryTypes.stringEnum(["foo", "bar", "baz"]).withDefault("baz").parse, [
            ["foo", "foo"],
            ["bar", "bar"],
            ["asdf", "baz"],
            ["", "baz"],
            [undefined, "baz"],
        ]));
    describe("stringEnum.serialize", () =>
        generateTests(queryTypes.stringEnum(["foo", "bar"]).serialize, [
            ["foo", "foo"],
            ["bar", "bar"],
            ["asdf" as any, "asdf"],
            [null, null],
            [undefined, undefined],
        ]));

    describe("json.parse", () =>
        generateTests(queryTypes.json().parse, [
            ['{"foo": 1}', { foo: 1 }],
            ['{"foo":{"bar":2}}', { foo: { bar: 2 } }],
            ["1", 1],
            ['"foo"', "foo"],
            ["asdf", null],
            ["", null],
            ["null", null],
            [undefined, null],
        ]));
    describe("json.withDefault.parse", () =>
        generateTests(queryTypes.json().withDefault({ baz: 10 }).parse, [
            ['{"foo": 1}', { foo: 1 }],
            ['{"foo":{"bar":2}}', { foo: { bar: 2 } }],
            ["1", 1],
            ['"foo"', "foo"],
            ["asdf", { baz: 10 }],
            ["", { baz: 10 }],
            [undefined, { baz: 10 }],
        ]));
    describe("json.serialize", () =>
        generateTests(queryTypes.json().serialize, [
            [{ foo: 1 }, '{"foo":1}'],
            [{ foo: { bar: 2 } }, '{"foo":{"bar":2}}'],
            [1, "1"],
            ["foo", '"foo"'],
            [null, null],
            [undefined, undefined],
        ]));

    describe("array(integer).parse", () =>
        generateTests(queryTypes.array(queryTypes.integer).parse, [
            ["1", [1]],
            [
                ["1", "2"],
                [1, 2],
            ],
            [
                ["1", "x", "3"],
                [1, 3],
            ],
            [["x", "y"], null],
            ["", null],
            [undefined, null],
        ]));
    describe("array(integer).withDefault.parse", () =>
        generateTests(queryTypes.array(queryTypes.integer).withDefault([7, 8, 9]).parse, [
            ["1", [1]],
            [
                ["1", "2"],
                [1, 2],
            ],
            [
                ["1", "x", "3"],
                [1, 3],
            ],
            [
                ["x", "y"],
                [7, 8, 9],
            ],
            ["", [7, 8, 9]],
            [undefined, [7, 8, 9]],
        ]));
    describe("array(integer).serialize", () =>
        generateTests(queryTypes.array(queryTypes.integer).serialize, [
            [[1], ["1"]],
            [
                [1, 2, 3],
                ["1", "2", "3"],
            ],
            [[], []],
            [null, null],
            [undefined, undefined],
        ]));

    describe("delimitedArray(integer).parse", () =>
        generateTests(queryTypes.delimitedArray(queryTypes.integer).parse, [
            ["1", [1]],
            ["1,2", [1, 2]],
            ["1,x,3", [1, 3]],
            ["x,y", null],
            ["", null],
            [undefined, null],
        ]));
    describe("delimitedArray(integer).withDefault.parse", () =>
        generateTests(queryTypes.delimitedArray(queryTypes.integer).withDefault([7, 8, 9]).parse, [
            ["1", [1]],
            ["1,2", [1, 2]],
            ["1,x,3", [1, 3]],
            ["x,y", [7, 8, 9]],
            ["", [7, 8, 9]],
            [undefined, [7, 8, 9]],
        ]));
    describe("delimitedArray(integer).serialize", () =>
        generateTests(queryTypes.delimitedArray(queryTypes.integer).serialize, [
            [[1], "1"],
            [[1, 2, 3], "1,2,3"],
            [[], null],
            [null, null],
            [undefined, undefined],
        ]));
});
