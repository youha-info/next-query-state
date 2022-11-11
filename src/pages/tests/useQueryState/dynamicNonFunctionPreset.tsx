import { useReducer, useRef } from "react";
import { queryTypes } from "src/defs";
import { useQueryState } from "src/useQueryState";

export default function DynamicNonFunctionPresetTestPage() {
    const [value, setValue] = useQueryState("val", queryTypes.string, { dynamic: true });

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
            }).map(([k, v]) => (
                <button id={k} key={k} onClick={v}>
                    {k}
                </button>
            ))}
        </>
    );
}
