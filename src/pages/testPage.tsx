import { useUrlState } from "src/useUrlState";

export default function TestPage() {
    const [value, set] = useUrlState("somekey");

    return (
        <div>
            <input onChange={(e) => set(e.currentTarget.value)} />
            <div>{value}</div>
        </div>
    );
}
