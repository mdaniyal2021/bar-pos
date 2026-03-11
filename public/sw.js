const CACHE_NAME = 'bar-pos-v2';

// Install — cache important pages
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/pos',
                '/login',
                '/images/default-product.png',
                '/manifest.json',
            ]).catch(err => console.log('[SW] Cache error:', err));
        })
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // API calls — Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request.clone())
                .then(response => {
                    if (response.ok) {
                        const cloned = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, cloned);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then(cached => {
                        if (cached) return cached;
                        return new Response(
                            JSON.stringify({ offline: true, error: 'You are offline' }),
                            { status: 503, headers: { 'Content-Type': 'application/json' } }
                        );
                    });
                })
        );
        return;
    }

    // Pages & static — Cache first, network fallback
    event.respondWith(
        caches.match(request).then(cached => {
            const networkFetch = fetch(request.clone()).then(response => {
                if (response.ok) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, response.clone());
                    });
                }
                return response;
            }).catch(() => cached);

            return cached || networkFetch;
        })
    );
});