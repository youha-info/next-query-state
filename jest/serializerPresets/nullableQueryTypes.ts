import { describe, expect, test } from "@jest/globals";
import { nullableQueryTypes } from "../../src/nullableQueryTypes";

function generateTests<T extends (...args: any) => any>(
    fn: T,
    scenarios: [Parameters<T>[0], ReturnType<T>][]
) {
    for (const [input, output] of scenarios)
        test(`${JSON.stringify(input)} -> ${JSON.stringify(output)}`, () =>
            expect(fn(input)).toEqual(output));
}

describe("nullableQueryTypes", () => {
    describe("string.parse", () =>
        generateTests(nullableQueryTypes.string.parse, [
            ["foo", "foo"],
            ["", ""],
            [["foo", "bar"], "foo"],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, undefined],
        ]));
    describe("string.withDefault.parse", () =>
        generateTests(nullableQueryTypes.string.withDefault("default").parse, [
            ["foo", "foo"],
            ["", ""],
            [["foo", "bar"], "foo"],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, "default"],
        ]));
    describe("string.serialize", () =>
        generateTests(nullableQueryTypes.string.serialize, [
            ["foo", "foo"],
            ["", ""],
            [null, "\0"],
            [undefined, null],
        ]));

    describe("integer.parse", () =>
        generateTests(nullableQueryTypes.integer.parse, [
            ["123", 123],
            ["-123", -123],
            ["123.2", 123],
            ["123.8", 123],
            ["-123.2", -124],
            [".123", 0],
            [["123", "456"], 123],
            [["", "456"], undefined],
            ["foo", undefined],
            ["NaN", undefined],
            ["Infinity", Infinity],
            ["-Infinity", -Infinity],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, undefined],
        ]));
    describe("integer.withDefault.parse", () =>
        generateTests(nullableQueryTypes.integer.withDefault(9999).parse, [
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
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, 9999],
        ]));
    describe("integer.serialize", () =>
        generateTests(nullableQueryTypes.integer.serialize, [
            [123, "123"],
            [123.2, "123"],
            [123.8, "123"],
            [Infinity, "Infinity"],
            [NaN, "NaN"],
            [null, "\0"],
            [undefined, null],
        ]));

    describe("float.parse", () =>
        generateTests(nullableQueryTypes.float.parse, [
            ["123", 123],
            ["-123", -123],
            ["123.2", 123.2],
            [".123", 0.123],
            [["123", "456"], 123],
            [["", "456"], undefined],
            ["foo", undefined],
            ["NaN", undefined],
            ["Infinity", Infinity],
            ["-Infinity", -Infinity],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, undefined],
        ]));
    describe("float.withDefault.parse", () =>
        generateTests(nullableQueryTypes.float.withDefault(99.99).parse, [
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
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, 99.99],
        ]));
    describe("integer.serialize", () =>
        generateTests(nullableQueryTypes.float.serialize, [
            [123, "123"],
            [123.2, "123.2"],
            [Infinity, "Infinity"],
            [NaN, "NaN"],
            [null, "\0"],
            [undefined, null],
        ]));

    describe("boolean.parse", () =>
        generateTests(nullableQueryTypes.boolean.parse, [
            ["true", true],
            ["TRUE", true],
            ["tRue", true],
            ["false", false],
            ["FALSE", false],
            ["fAlse", false],
            ["T", undefined],
            ["", undefined],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, undefined],
        ]));
    describe("boolean.withDefault.parse", () =>
        generateTests(nullableQueryTypes.boolean.withDefault(false).parse, [
            ["true", true],
            ["TRUE", true],
            ["tRue", true],
            ["false", false],
            ["FALSE", false],
            ["fAlse", false],
            ["T", false],
            ["", false],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, false],
        ]));
    describe("boolean.serialize", () =>
        generateTests(nullableQueryTypes.boolean.serialize, [
            [true, "true"],
            [false, "false"],
            [null, "\0"],
            [undefined, null],
        ]));

    describe("timestamp.parse", () =>
        generateTests(nullableQueryTypes.timestamp.parse, [
            ["1668493407000", new Date(1668493407000)],
            ["foo", undefined],
            ["Infinity", undefined],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, undefined],
        ]));
    describe("timestamp.withDefaultparse", () =>
        generateTests(nullableQueryTypes.timestamp.withDefault(new Date(1660000000000)).parse, [
            ["1668493407000", new Date(1668493407000)],
            ["foo", new Date(1660000000000)],
            ["Infinity", new Date(1660000000000)],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, new Date(1660000000000)],
        ]));
    describe("timestamp.serialize", () =>
        generateTests(nullableQueryTypes.timestamp.serialize, [
            [new Date(1668493407000), "1668493407000"],
            [new Date(NaN), null],
            [null, "\0"],
            [undefined, null],
        ]));

    describe("isoDateTime.parse", () =>
        generateTests(nullableQueryTypes.isoDateTime.parse, [
            ["2022-11-15T06:23:27.000Z", new Date(1668493407000)],
            ["foo", undefined],
            ["Infinity", undefined],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, undefined],
        ]));
    describe("isoDateTime.withDefault.parse", () =>
        generateTests(nullableQueryTypes.isoDateTime.withDefault(new Date(1660000000000)).parse, [
            ["2022-11-15T06:23:27.000Z", new Date(1668493407000)],
            ["foo", new Date(1660000000000)],
            ["Infinity", new Date(1660000000000)],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, new Date(1660000000000)],
        ]));
    describe("isoDateTime.serialize", () =>
        generateTests(nullableQueryTypes.isoDateTime.serialize, [
            [new Date(1668493407000), "2022-11-15T06:23:27.000Z"],
            [new Date(NaN), null],
            [null, "\0"],
            [undefined, null],
        ]));

    describe("stringEnum.parse", () =>
        generateTests(nullableQueryTypes.stringEnum(["foo", "bar"]).parse, [
            ["foo", "foo"],
            ["bar", "bar"],
            ["asdf", undefined],
            ["", undefined],
            ["\0", null],
            [["\0", "foo"], null],
            [undefined, undefined],
        ]));
    describe("stringEnum.withDefault.parse", () =>
        generateTests(
            nullableQueryTypes.stringEnum(["foo", "bar", "baz"]).withDefault("baz").parse,
            [
                ["foo", "foo"],
                ["bar", "bar"],
                ["asdf", "baz"],
                ["", "baz"],
                ["\0", null],
                [["\0", "foo"], null],
                [undefined, "baz"],
            ]
        ));
    describe("stringEnum.serialize", () =>
        generateTests(nullableQueryTypes.stringEnum(["foo", "bar"]).serialize, [
            ["foo", "foo"],
            ["bar", "bar"],
            ["asdf" as any, "asdf"],
            [null, "\0"],
            [undefined, null],
        ]));

    describe("json.parse", () =>
        generateTests(nullableQueryTypes.json().parse, [
            ['{"foo": 1}', { foo: 1 }],
            [['{"foo": 1}', '{"bar": 2}'], { foo: 1 }],
            ['{"foo":{"bar":2}}', { foo: { bar: 2 } }],
            ["1", 1],
            ['"foo"', "foo"],
            ["asdf", undefined],
            ["", undefined],
            ["null", null],
            ["\0", undefined],
            [undefined, undefined],
        ]));
    describe("json.withDefault.parse", () =>
        generateTests(nullableQueryTypes.json().withDefault({ baz: 10 }).parse, [
            ['{"foo": 1}', { foo: 1 }],
            [['{"foo": 1}', '{"bar": 2}'], { foo: 1 }],
            ['{"foo":{"bar":2}}', { foo: { bar: 2 } }],
            ["1", 1],
            ['"foo"', "foo"],
            ["asdf", { baz: 10 }],
            ["", { baz: 10 }],
            ["null", null],
            ["\0", { baz: 10 }],
            [undefined, { baz: 10 }],
        ]));
    describe("json.serialize", () =>
        generateTests(nullableQueryTypes.json().serialize, [
            [{ foo: 1 }, '{"foo":1}'],
            [{ foo: { bar: 2 } }, '{"foo":{"bar":2}}'],
            [1, "1"],
            ["foo", '"foo"'],
            [null, "null"],
            [undefined, null],
        ]));

    describe("array(integer).parse", () =>
        generateTests(nullableQueryTypes.array(nullableQueryTypes.integer).parse, [
            ["1", [1]],
            ["\0", [null]],
            [
                ["1", "2"],
                [1, 2],
            ],
            [
                ["1", "\0", "\0"],
                [1, null, null],
            ],
            [
                ["1", "x", "3"],
                [1, 3],
            ],
            [["x", "y"], undefined],
            ["", undefined],
            [undefined, undefined],
        ]));
    describe("array(integer).withDefault.parse", () =>
        generateTests(
            nullableQueryTypes.array(nullableQueryTypes.integer).withDefault([7, 8, 9]).parse,
            [
                ["1", [1]],
                ["\0", [null]],
                [
                    ["1", "2"],
                    [1, 2],
                ],
                [
                    ["1", "\0", "\0"],
                    [1, null, null],
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
            ]
        ));
    describe("array(integer).serialize", () =>
        generateTests(nullableQueryTypes.array(nullableQueryTypes.integer).serialize, [
            [[1], ["1"]],
            [
                [1, 2, 3],
                ["1", "2", "3"],
            ],
            [[], []],
            [[null], ["\0"]],
            [
                [null, 1],
                ["\0", "1"],
            ],
            [undefined, null],
        ]));

    describe("delimitedArray(integer).parse", () =>
        generateTests(nullableQueryTypes.delimitedArray(nullableQueryTypes.integer).parse, [
            ["1", [1]],
            ["\0", [null]],
            ["1,2", [1, 2]],
            ["1,\0,\0", [1, null, null]],
            ["1,x,3", [1, 3]],
            ["x,y", undefined],
            ["", undefined],
            [undefined, undefined],
        ]));
    describe("delimitedArray(integer).withDefault.parse", () =>
        generateTests(
            nullableQueryTypes.delimitedArray(nullableQueryTypes.integer).withDefault([7, 8, 9])
                .parse,
            [
                ["1", [1]],
                ["\0", [null]],
                ["1,2", [1, 2]],
                ["1,\0,\0", [1, null, null]],
                ["1,x,3", [1, 3]],
                ["x,y", [7, 8, 9]],
                ["", [7, 8, 9]],
                [undefined, [7, 8, 9]],
            ]
        ));
    describe("delimitedArray(integer).serialize", () =>
        generateTests(nullableQueryTypes.delimitedArray(nullableQueryTypes.integer).serialize, [
            [[1], "1"],
            [[1, 2, 3], "1,2,3"],
            [[], null],
            [[null], "\0"],
            [[null, 1], "\0,1"],
            [undefined, null],
        ]));
});
