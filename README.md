# next-query-state
[![NPM](https://img.shields.io/npm/v/next-query-state?color=red)](https://www.npmjs.com/package/next-query-state)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/next-query-state)](https://bundlephobia.com/package/next-query-state)
[![GitHub license](https://img.shields.io/badge/license-MIT-green)](https://github.com/youha-info/next-query-state/blob/main/LICENSE)

Easy state management of URL query string for Next.js

Save state in URL to persist state between forward/back navigation, bookmarks, and sharing links.

## Features

### 🌟 Ease of use

Persisting state in the query string with `next/router` is such a hassle. Instead of having to use as below,

```ts
const router = useRouter();
const state = parseInt(router.query.state) || 0;

router.push({ query: { ...router.query, state: 10 } });
```

You can manage state similar to `React.useState`.

```ts
const [state, setState] = useQueryState("state", queryTypes.integer.withDefault(0));

setState(10);
```

<br/>

### 📚 Batched URL updates

With `next/router` or most other packages, updating query state multiple times inside a render causes the updates to overwrite each other.

`next-query-state` uses [next-batch-router](https://github.com/youha-info/next-batch-router), so that URL updates are collected during the render phase and batched together in one URL update.

This allows for updating query states individually just like using `useState` instead of having to group states to be updated together. It also makes URL history cleaner by not creating partially updated histories in case you use `push` to update states.

<br/>

❌ This is wrong. It results in `?a=1` or `?b=2`

```ts
const router = useRouter();
router.push({ query: { ...router.query, a: 1 } });
router.push({ query: { ...router.query, b: 2 } });
```

✅ `next-query-states` results in `?a=1&b=2`

```ts
const [a, setA] = useQueryState("a", queryTypes);
setA(1);
setB(2);
```

🟡 Most other solutions require grouping of states, which can cause coupling and timing issues.

```ts
const [states, setStates] = useQueryStates({ a: queryTypes.string, b: querytypes.string });
setStates({ a: 1, b: 2 });
```

<br/>

### ⏩ Supports functional updates

You can do functional updates as if using `useState`

```ts
// Functional update also works!
const [state, setState] = useQueryState("state");
setState((prev) => prev + 10);
```

<br/>

### 🚀 Static generation friendly

When Next.js prerenders pages to static HTML at build time, it doesn't have any data about the query string.
Therefore to avoid hydration error, client must behave as if there is no query string in the first render. next-query-state relies on Next.js `router.query` instead of `window.location` so it naturally avoids this problem.

If you don't want the default value to briefly show on first render, don't render the value or show placeholders when `router.isReady` is false.

---

<br/>

## Installation

```sh
$ yarn add next-query-state
or
$ npm install next-query-state
```

<br/>

Then, set up `<BatchRouterProvider/>` at the top of the component tree, preferably inside pages/\_app.js

```js
import { BatchRouterProvider } from "next-query-state";
// or import { BatchRouterProvider } from "next-batch-router";

const MyApp = ({ Component, pageProps }) => (
    <BatchRouterProvider>
        <Component {...pageProps} />
    </BatchRouterProvider>
);
```

---

<br/>

## Usage

`BatchRouterProvider` must be provided as above!

```ts
import { useQueryState, queryTypes } from "next-query-state";

export default function TestPage() {
    // Most basic usage, only designating parameter key
    const [basicString, setBasicString] = useQueryState("basicString");

    // Integer typed parameter with 0 as default value
    const [int, setInt] = useQueryState("int", queryTypes.integer.withDefault(0));

    // Array of enum strings. Adds url history.
    const [enumArr, setEnumArr] = useQueryState(
        "enumArr",
        queryTypes.array(queryTypes.stringEnum(["some", "available", "values"])).withDefault([]),
        { history: "push" }
    );

    const clearAll = () => {
        setBasicString(null);
        setInt(null);
        setEnumArr(null);
    };

    return (
        <div>
            <div>basicString: {basicString}</div>
            <button onClick={() => setBasicString("foo")}>Set to "foo"</button>
            <button onClick={() => setBasicString(null)}>Clear</button>

            <div>num: {int}</div>
            <button onClick={() => setInt((p) => p + 1)}>Increment number</button>

            <div> enumArr: {enumArr.join(" ")} </div>
            <button onClick={() => setEnumArr([...enumArr, "values"])}>Add "values"</button>

            <div>
                <button onClick={clearAll}>Clear all</button>
            </div>
        </div>
    );
}
```

---

<br/>

## Background on Types

Each query parameter has two types. `T` and `WT`, and it's converted from and to types of `next-batch-router`.

When you use `const [foo, setFoo] = useQueryState("foo")`, `foo` is type `T`, and `setFoo` is a function that takes `WT`.

`T`: The type of the query parameter.

-   `null` value expresses absense of the query parameter in URL(When using `queryTypes` preset).

`WT`: The **write type** of query parameter.

-   It is a superset of `T`, and usually includes `null` and `undefined`.
-   The type and behavior is determined by the serializer function, as the serializer turns `WT` into `WriteQueryValue` to be passed on to `next-batch-router`. It is fully customizable.

`NextQueryValue`: Parsed query string data that is provided by `next/router`. `parse` function converts this to `T`.

-   `string | string[] | undefined`

`WriteQueryValue`: Type that's passed to `next-batch-router` to change the URL. `serialize` function converts `WT` to this.

-   `string | number | boolean | (string | number | boolean)[] | null | undefined`

-   `null` is used to remove from url. `undefined` is ignored and leaves value as is.
-   Array creates multiple key=value in the URL with the same key.
    For example, if `[1, 2, 3]` is set to `'foo'` parameter, URL becomes like this: `/?foo=1&foo=2&foo=3`
-   Other types are serialized to string.

The types are converted in this direction, forming a loop: `NextQueryValue` -(parser)-> `T` -(your state update logic)-> `WT` -(serializer)-> `WriteQueryValue` -(URL change)-> `NextQueryValue`

<br/>

## `useQueryState<T, WT>(key, serializers, options): [T, update<T, WT>]`

### Parameters

`key`: `string`

-   Key to use in the query string. Required.

`serializers`?: `{ parse?: function, serialize?: function }`

-   Object that consists of `parse` and `serialize` functions that transforms the state from and to the URL string.
-   This parameter is fixed on the first hook call, and should not be changed unless `dynamic` option is set to true.
-   You won't likely create this object yourself, but use one of the presets in `queryTypes` or `nullableQueryTypes` like `useQueryState("foo", queryTypes.string)`.
    See the below section about presets.

-   `parse`?: `(v: NextQueryValue) => T`
    -   Function that parses `NextQueryValue` to the desired type `T`.
    -   Default value feature is implemented inside this function.
-   `serialize`?: `(v: WT) -> WriteQueryValue`
    -   Transform `WT` into `WriteQueryValue` type.

`options`?: `{ history?: "push" | "replace", dynamic?: boolean }`

-   `history`?: `"push" | "replace"`
    -   Set to "push" to add URL history so you can go back to previous state, and set to "replace" to prevent adding history.
    -   Default is "replace".
    -   It can be overridden when updating state eg: `setState(newVal, {history:"push"})`
-   `dynamic`?: `boolean`
    -   `parse` and `serialize` options are fixed on the first hook call, as if putting default value in `useState`.
    -   This restriction is for memoization of the returned value from the hook.
    -   You can set `dynamic` to `true` to change `parse` and `serialize` functons at runtime, but referential equality
        of the function must be manually managed for the memoization to work.
    -   Currently, stale updater function returned from the hook uses previously supplied parse and serialize functions,
        so you must always use update function freshly returned from the hook.

### Returns

`value`: `T`

-   The state of the query parameter. It's parsed from query string and type converted.

`update`: `(stateUpdater, options) => Promise<void>`

-   Function to update state of the query parameter.
-   Returns a promise that resolves when URL change is finished.
    Check [Next.js docs](https://nextjs.org/docs/api-reference/next/router#potential-eslint-errors) if no-floating-promises ESLint error occurs.

-   `stateUpdater`: `WT | (prev: T) => WT`

    -   Similar to `React.useState`, the new value to update, or a function that takes previous value and returns a new value.
    -   When using `queryTypes` preset, `null` removes parameter from URL, and `undefined` is ignored.

-   `options`: `{ history?: "push" | "replace", scroll?: boolean, shallow?: boolean, locale?: string }`

    -   `history`?: `"push" | "replace"`

        -   Overrides history mode set on the hook.
        -   Set to "push" to add URL history so you can go back to previous state, and set to "replace" to prevent adding history.

    -   `scroll`?: `boolean`

        -   Scroll to the top of the page after navigation.
        -   Defaults to `true`.
        -   When multiple `push` and `replace` calls are merged, all must have `scroll: false` to not scroll after navigation.

    -   `shallow`?: `boolean`

        -   Update the path of the current page without rerunning `getStaticProps`, `getServerSideProps` or `getInitialProps`.
        -   Defaults to `false`.
        -   When merged, all must have `shallow: true` to do shallow routing.

    -   `locale`?: `string`

        -   Indicates locale of the new page. When merged, the last one will be applied.

<br/>

## Serializers Presets

### `queryTypes`

`null` means no key in url. (`/?`)

`empty string` means only key and no value in URL (`/?foo=`)

`undefined` only exists in `WT`, and means 'leave value as is'

If param exists multiple times(`?foo=1&foo=2`), array serializer reads it as array, and other serializers only read the first one.

When you use `withDefault()`, since there is a default value, `null` is excluded from `T`.
However, it still exists in `WT` so you can remove key from the URL to set value to default value.

| Serializers                                | Type                          | Extra                                                                                  | Value example                   | URL example                         |
| ------------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------- |
| string                                     | `string`                      |                                                                                        | "foo"                           | ?state=foo                          |
| integer                                    | `number`                      | Non-integer value is floored. Can set and read Infinity.                               | 123                             | ?state=123                          |
| float                                      | `number`                      | Can set and read Infinity.                                                             | 12.3                            | ?state=12.3                         |
| boolean                                    | `boolean`                     | Value must be "true" or "false" but their casing is ignored (ex. "tRUe")               | true                            | ?state=true                         |
| timestamp                                  | `Date`                        |                                                                                        | new Date(2022, 9, 1, 12, 30, 0) | ?state=1664627400000                |
| isoDateTime                                | `Date`                        |                                                                                        | new Date(2022, 9, 1, 12, 30, 0) | ?state=2022-10-01T03%3A30%3A00.000Z |
| stringEnum<Enum>(validValues)              | `string` (or string literals) | Declare valid values as `["foo"] as const`, or set type via generic for type support.  | "foo"                           | ?state=foo                          |
| json<T>                                    | `any`                         | Schema is not validated.                                                               | {foo: "bar"}                    | ?state=%7B%22foo%22%3A%22bar%22%7D  |
| array(itemSerializers)                     | `T[]`                         | Nested arrays unavailable.                                                             | [1,2,3]                         | ?state=1&state=2&state=3            |
| delimitedArray(itemSerializers, separator) | `T[]`                         | Separator character inside value will cause bugs, and separator might get URL encoded. | [1,2,3]                         | ?state=1%2C2%2C3                    |

### `nullableQueryTypes`

Experimental preset that allows `null` as a value, not as absense of value. `null` is encoded as `%00`.

`null` means `null` value (`/?foo=%00`)

`undefined` means no key in url. (`/?`)

`empty string` means only key and no value in URL (`/?foo=`)

When you use `withDefault()`, since there is a default value, `undefined` is excluded from `T`.
However, it still exists in `WT` so you can remove key from the URL to set value to default value.

<br/>

## `useQueryStates<KeyMap>(keys, options): [Values, update<Values>]`

Synchronise multiple query string arguments at once.

This is similar to `useQueryState`, but without memoization and is more dynamic.
For most cases, using `useQueryState` is recommended, and `useQueryStates` is intended for below cases.

1. The keys are changed at runtime. (Since conditional use of useQueryState is illegal)
2. New value is determined by other params while doing functional update.

### Parameters

`keys`: `Record<string, Serializers>`

-   Object that has query string key as key and serializers as value.
-   For example: `{foo: queryTypes.string, bar:queryTypes.integer.withDefault(0)}`
-   Number of the keys and its types can be changed dynamically.
-   Check description of `serializers` parameter of `useQueryStates` for more info.

`options`: { history?: "push" | "replace" }

-   `history`?: `"push" | "replace"`
    -   Equal to `useQueryState`

### Returns

`values`: `Values`

-   The state of the query parameters defined in `keys` with their own typs. They are parsed from query string and type converted.

`update`: `(stateUpdater, options) => Promise<void>`

-   Function to update states of the query parameter.
-   Returns a promise that resolves when URL change is finished.
    Check [Next.js docs](https://nextjs.org/docs/api-reference/next/router#potential-eslint-errors) if no-floating-promises ESLint error occurs.

-   `stateUpdater`: `WriteValues | (prev: Values) => WriteValues`

    -   Similar to `useQueryState` but previous states and new states are objects.
    -   If a key is not in write object, its value is left as is.
        To remove all keys from the URL, you must manually set them to `null` or `undefined` depending on the serializer.

-   `options`: `{ history?: "push" | "replace", scroll?: boolean, shallow?: boolean, locale?: string }`

    -   Equal to `useQueryState`

<br/>


## Credits

This package is based on [next-usequerystate](https://github.com/47ng/next-usequerystate)
with different design choices and implementation.
