import { AppProps } from "next/app";
import { BatchRouterProvider } from "next-batch-router"

export default function App({ Component, pageProps }: AppProps) {
    // @ts-ignore
    if (Component.noProvider) return <Component {...pageProps} />;

    return (
        <BatchRouterProvider>
            <Component {...pageProps} />
        </BatchRouterProvider>
    );
}
