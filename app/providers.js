'use client';

import { SessionProvider } from 'next-auth/react';
import OfflineBanner from './components/OfflineBanner';

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <OfflineBanner />
            {children}
        </SessionProvider>
    );
}