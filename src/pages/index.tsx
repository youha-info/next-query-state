import { queryTypes } from "src/defs";
import { useQueryState } from "src/useQueryState";

export default function TestPage() {
    // Most basic usage, only designating parameter key
    const [basicString, setBasicString] = useQueryState("basicString");

    // Integer typed parameter with 0 as default value
    const [int, setInt] = useQueryState("int", queryTypes.integer.withDefault(0));

    // Array of enum strings. Adds url history.
    const [enumArr, setEnumArr] = useQueryState(
        "enumArr",
        queryTypes
            .array(queryTypes.stringEnum(["some", "available", "values"] as const))
            .withDefault([]),
        { history: "push" }
    );

    const clearAll = () => {
        setBasicString(null);
        setInt(null);
        setEnumArr(null);
    };

    return (
        <div>
            <div>basicString: {basicString}</div>
            <button onClick={() => setBasicString("foo")}>Set to "foo"</button>
            <button onClick={() => setBasicString(null)}>Clear</button>

            <div>num: {int}</div>
            <button onClick={() => setInt((p) => p + 1)}>Increment number</button>

            <div> enumArr: {enumArr.join(" ")} </div>
            <button onClick={() => setEnumArr([...enumArr, "values"])}>Add "values"</button>

            <div>
                <button onClick={clearAll}>Clear all</button>
            </div>
        </div>
    );
}
