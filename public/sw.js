const CACHE_NAME = 'bar-pos-v4';

const STATIC_ASSETS = [
    '/pos',
    '/login',
    '/manifest.json',
    '/images/default-product.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                STATIC_ASSETS.map(url =>
                    cache.add(url).catch(err => console.log('[SW] Failed to cache:', url, err))
                )
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // Images — Cache First
    if (
        url.pathname.startsWith('/images/') ||
        url.pathname.startsWith('/uploads/') ||
        url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
    ) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                }).catch(() => new Response(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#eee"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="12">No Image</text></svg>',
                    { headers: { 'Content-Type': 'image/svg+xml' } }
                ));
            })
        );
        return;
    }

    // API — Network First, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                }
                return response;
            }).catch(() => {
                return caches.match(request).then(cached => {
                    if (cached) return cached;
                    return new Response(
                        JSON.stringify({ offline: true, error: 'You are offline', data: [] }),
                        { status: 200, headers: { 'Content-Type': 'application/json' } }
                    );
                });
            })
        );
        return;
    }

    // JS/CSS/_next — Cache First
    if (
        url.pathname.startsWith('/_next/') ||
        url.pathname.match(/\.(js|css|woff|woff2|ttf)$/)
    ) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                }).catch(() => new Response('', { status: 408 }));
            })
        );
        return;
    }

    // Pages — Network First
    event.respondWith(
        fetch(request).then(response => {
            if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
            }
            return response;
        }).catch(() => {
            return caches.match(request).then(cached => {
                if (cached) return cached;
                return caches.match('/pos');
            });
        })
    );
});