import { queryTypes } from "src/defs";
import { useQueryStates } from "src/useQueryStates";

export default function BasicPage() {
    const [{ defaultStr, str, int }, setStates] = useQueryStates({
        defaultStr: queryTypes.string.withDefault("default"),
        str: queryTypes.string,
        int: queryTypes.integer.withDefault(0),
    });

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div id="defaultStr">{JSON.stringify(defaultStr)}</div>

            <div id="str">{JSON.stringify(str)}</div>
            <input
                id="strInput"
                value={str ?? ""}
                onChange={(e) => setStates({ str: e.currentTarget.value })}
            />

            <div id="int">{JSON.stringify(int)}</div>

            {Object.entries<(e: any) => void>({
                functionalAddInt: () => setStates((prev) => ({ int: prev.int + 1 })),
                changeStrWithTimeout: () => setTimeout(() => setStates({ str: "timeout" }), 500),
                multipleSetWithPush: () => {
                    setStates({ str: "strValue" }, { history: "push" });
                    setStates({ int: 10 });
                },
            }).map(([k, v]) => (
                <button id={k} key={k} onClick={v}>
                    {k}
                </button>
            ))}
        </div>
    );
}
