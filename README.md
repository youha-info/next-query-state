# next-query-state

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

You can use just as if you would use `useState`.

```ts
const [state, setState] = useQueryState("state", queryTypes.integer.withDefault(0));

setState(10);
```

```ts
// Functional update also available!
setState((prev) => prev + 10);
```

### 📚 Batched URL updates

With `next/router` or most other packages, updating query state multiple times inside a render causes the updates to overwrite each other.

next-query-state uses [next-batch-router](https://github.com/youha-info/next-batch-router), so that URL updates are collected during the render phase and batched together in one URL update.

This allows for updating query states individually just like using `useState` instead of having to group states to be updated together. It also makes URL history cleaner by not creating partially updated histories in case you use `push` to update states.

### 🚀 Static Generation friendly

When Next.js prerenders pages to static HTML at build time, it doesn't have any data about the query string.
Therefore to avoid hydration error, client must behave as if there is no query string in the first render. next-query-state relies on Next.js `router.query` instead of `window.location` so it naturally avoids this problem.

---

## Installation

```sh
$ yarn add next-query-state
or
$ npm install next-query-state
```

## Usage

Set up `<BatchRouterProvider/>` at the top of the component tree, preferably inside pages/\_app.js

```js
import { BatchRouterProvider } from "next-batch-router";

const MyApp = ({ Component, pageProps }) => (
    <BatchRouterProvider>
        <Component {...pageProps} />
    </BatchRouterProvider>
);
```

Most simple

```ts
import { useQueryState } from "next-query-state";
```

## Documentation

### `useQueryState<T>(key, options): [T, update<T>]`

`key`: string

Key to use in the query string.

`options`: { parse?: function, serialize?: function, history?: "push" | "replace", dynamic?: boolean }

-   `parse?`: `(v: string | string[] | undefined) => T`
    -   Parse string, array of string, or undefined from next/router's query object to the desired type.
    -   Default value should be set here.
-   `serialize`?: `(v: T) -> string | string[] | number | number[] | boolean | boolean[] | null | undefined`
    -   Serialize value into serializable form
-   `history`?: `"push" | "replace"`
-   `dynamic`?: `boolean`

### parsing & serializing

### useQueryStates

## Tips

If you don't want the default value to briefly show on first render, don't render the value when router.isReady is false.

## Credits

This package is based on [next-usequerystate](https://github.com/47ng/next-usequerystate)
with different design choices and implementation.
