import { nullableQueryTypes } from "src/nullableQueryTypes";
import { useQueryState } from "src/useQueryState";

export default function TestPage() {
    const [value, set] = useQueryState("somekey", nullableQueryTypes.string);

    return (
        <div>
            <input onChange={(e) => set(e.currentTarget.value || null)} />
            <div>value: {JSON.stringify(value)}</div>
        </div>
    );
}
