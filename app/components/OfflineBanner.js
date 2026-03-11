'use client';

import { useState, useEffect } from 'react';

export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        setIsOffline(!navigator.onLine);

        const goOffline = () => setIsOffline(true);
        const goOnline = () => setIsOffline(false);

        window.addEventListener('offline', goOffline);
        window.addEventListener('online', goOnline);

        return () => {
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online', goOnline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            background: '#f39c12',
            color: 'white',
            padding: '8px 20px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 'bold',
            zIndex: 9999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
            📶 You are offline — using cached data
        </div>
    );
}