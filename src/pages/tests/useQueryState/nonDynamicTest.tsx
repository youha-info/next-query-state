import { useReducer, useRef, useState } from "react";
import { HistoryOptions, queryTypes } from "src/defs";
import { useQueryState } from "src/useQueryState";

export default function NonDynamicTestPage() {
    const [key, setKey] = useState("val");
    const [history, setHistory] = useState<HistoryOptions>("replace");

    const [value, setValue] = useQueryState(
        key,
        queryTypes.json<{ a: number }>().withDefault({ a: 1 }),
        { history }
    );

    const ref = useRef({ value, setValue });
    const lastRef = ref.current;
    ref.current = { value, setValue };

    const [, forceRender] = useReducer((prev) => prev + 1, 0);

    return (
        <>
            <div id="value">{JSON.stringify(value)}</div>
            <div id="equality">
                {JSON.stringify({
                    valueEq: value === lastRef.value,
                    setValueEq: setValue === lastRef.setValue,
                })}
            </div>

            {Object.entries<(e: any) => void>({
                forceRender,
                changeKey: () => setKey("val2"),
                changeHistoryToPush: () => setHistory("push"),
                updateValue: () => setValue((prev) => ({ a: prev.a + 1 })),
            }).map(([k, v]) => (
                <button id={k} key={k} onClick={v}>
                    {k}
                </button>
            ))}
        </>
    );
}
