const CACHE_NAME = 'bar-pos-v1';

// Files jo offline kaam karen
const STATIC_ASSETS = [
    '/',
    '/login',
    '/pos',
    '/admin/dashboard',
    '/admin/categories',
    '/admin/products',
    '/admin/orders',
    '/admin/users',
    '/images/default-product.png',
    '/manifest.json',
];

// Install — cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
        }).catch(err => console.log('[SW] Cache failed:', err))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch — Network First, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and chrome-extension requests
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // API calls — Network first, no cache
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful API responses
                    if (response.ok) {
                        const cloned = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, cloned);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Offline — return cached API response
                    return caches.match(request).then(cached => {
                        if (cached) return cached;
                        // Return empty JSON for API calls when offline
                        return new Response(
                            JSON.stringify({ error: 'You are offline', offline: true }),
                            {
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    });
                })
        );
        return;
    }

    // Static assets & pages — Cache first
    event.respondWith(
        caches.match(request).then(cached => {
            if (cached) return cached;

            return fetch(request).then(response => {
                if (response.ok) {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, cloned);
                    });
                }
                return response;
            }).catch(() => {
                // Offline fallback
                return caches.match('/') || new Response('Offline', { status: 503 });
            });
        })
    );
});