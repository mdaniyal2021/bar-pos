import './globals.css';
import Providers from './providers';

export const metadata = {
    title: 'Bar POS',
    description: 'Bar Point of Sale System',
    manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#2c3e50" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Bar POS" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            </head>
            <body
                style={{ margin: 0, fontFamily: 'Arial, sans-serif' }}
                suppressHydrationWarning
            >
                <Providers>
                    {children}
                </Providers>
                <script dangerouslySetInnerHTML={{
                    __html: `
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/sw.js')
                                    .then(function(reg) {
                                        console.log('SW registered:', reg.scope);
                                    })
                                    .catch(function(err) {
                                        console.log('SW registration failed:', err);
                                    });
                            });
                        }
                    `
                }} />
            </body>
        </html>
    );
}