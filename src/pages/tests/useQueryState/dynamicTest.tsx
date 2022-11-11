import { useReducer, useRef, useState } from "react";
import { queryTypes } from "src/defs";
import { useQueryState } from "src/useQueryState";

export default function DynamicTestPage() {
    const [defaultVal, setDefaultVal] = useState(1);
    const [dynamic, setDynamic] = useQueryState("dynamic", queryTypes.boolean.withDefault(true));

    const [value, setValue] = useQueryState(
        "val",
        queryTypes.json<{ a: number }>().withDefault({ a: defaultVal }),
        { dynamic }
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
                updateValue: () => setValue((prev) => ({ a: prev.a + 1 })),
                incrementDefaultVal: () => setDefaultVal(defaultVal + 1),
            }).map(([k, v]) => (
                <button id={k} key={k} onClick={v}>
                    {k}
                </button>
            ))}
        </>
    );
}
