import { nullableQueryTypes } from "src/nullableQueryTypes";
import { useUrlState } from "src/useUrlState";

export default function TestPage() {
    const [value, set] = useUrlState("somekey", nullableQueryTypes.string);

    return (
        <div>
            <input onChange={(e) => set(e.currentTarget.value || null)} />
            <div>value: {JSON.stringify(value)}</div>
        </div>
    );
}
