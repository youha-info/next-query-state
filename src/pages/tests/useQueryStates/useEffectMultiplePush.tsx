import { useRouter } from "next/router";
import { useEffect } from "react";
import { queryTypes } from "src/defs";
import { useQueryStates } from "src/useQueryStates";

export default function UseEffectMultiplePushPage() {
    const router = useRouter();

    return (
        <div>
            <div id="query">{JSON.stringify(router.query)}</div>

            <InitializingComponent name="f1" value="1" />
            <InitializingComponent name="f2" value="2" />
            <InitializingComponent name="f3" value="3" />
        </div>
    );
}

type InitializingComponentProps = {
    name: string;
    value: string;
};
function InitializingComponent({ name, value }: InitializingComponentProps) {
    const [val, setStates] = useQueryStates({ [name]: queryTypes.string }, { history: "push" });

    useEffect(() => {
        setStates({ [name]: value });
    }, []);

    return <div>{name}</div>;
}
