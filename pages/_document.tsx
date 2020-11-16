import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    <meta charSet='utf-8' />
                    <link rel="apple-touch-icon" sizes="180x180" href="favicon/apple-touch-icon.png" />
                    <link rel="icon" type="image/png" href="favicon/favicon-32x32.png" sizes="32x32" />
                    <link rel="icon" type="image/png" href="favicon/favicon-16x16.png" sizes="16x16" />
                    <link rel="manifest" href="favicon/manifest.json" />
                    <link rel="mask-icon" href="favicon/safari-pinned-tab.svg" color="#5bbad5" />
                    <link rel="shortcut icon" href="favicon/favicon.ico" />
                    <meta name="apple-mobile-web-app-title" content="Mumble" />
                    <meta name="application-name" content="Mumble" />
                    <meta name="msapplication-config" content="${require('./favicon/browserconfig.xml')}" />
                    <meta name="theme-color" content="#ffffff" />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}