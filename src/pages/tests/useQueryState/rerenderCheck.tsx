import { useRouter } from "next/router";
import React, { useRef } from "react";
import { queryTypes } from "src/defs";
import { useQueryState } from "src/useQueryState";

export default function RerenderCheckPage() {
    const ref = useRef(0);
    ref.current++;
    return (
        <>
            <div id="parentCounter">{ref.current}</div>
            <MemoizedParent />
        </>
    );
}

const MemoizedParent = React.memo(() => {
    const ref = useRef(0);
    ref.current++;
    return (
        <>
            <div id="memoizedParentCounter">{ref.current}</div>
            <Child />
            <SiblingWithoutRouterAccess />
            <SiblingWithRouterAccess />
        </>
    );
});

function Child() {
    const ref = useRef(0);
    ref.current++;

    // const [str, setStr] = useState("")
    const [str, setStr] = useQueryState("str", queryTypes.string.withDefault(""));

    return (
        <>
            <div id="childCounter">{ref.current}</div>
            <div id="str">{JSON.stringify(str)}</div>
            <input
                id="strInput"
                value={str}
                onChange={(e) => setStr(e.currentTarget.value, { shallow: true })}
            />
        </>
    );
}

function SiblingWithoutRouterAccess() {
    const ref = useRef(0);
    ref.current++;

    return <div id="siblingWithoutRouterAccessCounter">{ref.current}</div>;
}

function SiblingWithRouterAccess() {
    const ref = useRef(0);
    ref.current++;

    const router = useRouter();

    return <div id="siblingWithRouterAccessCounter">{ref.current}</div>;
}
