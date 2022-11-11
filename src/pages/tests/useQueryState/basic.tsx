import { queryTypes } from "src/defs";
import { useQueryState } from "src/useQueryState";

export default function BasicPage() {
    const [defaultStr, setDefaultStr] = useQueryState(
        "defaultStr",
        queryTypes.string.withDefault("default")
    );
    const [str, setStr] = useQueryState("str");

    const [int, setInt] = useQueryState("int", queryTypes.integer.withDefault(0));

    return (
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div id="defaultStr">{JSON.stringify(defaultStr)}</div>

            <div id="str">{JSON.stringify(str)}</div>
            <input
                id="strInput"
                value={str ?? ""}
                onChange={(e) => setStr(e.currentTarget.value)}
            />

            <div id="int">{JSON.stringify(int)}</div>

            {Object.entries<(e: any) => void>({
                functionalAddInt: () => setInt((prev) => prev + 1),
                changeStrWithTimeout: () => setTimeout(() => setStr("timeout"), 500),
                multipleSetWithPush: () => {
                    setStr("strValue", { history: "push" });
                    setInt(10);
                },
            }).map(([k, v]) => (
                <button id={k} key={k} onClick={v}>
                    {k}
                </button>
            ))}
        </div>
    );
}
