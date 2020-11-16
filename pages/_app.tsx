import { AppProps } from 'next/app'

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <Component {...pageProps} />
    </>
  )
}

export default App