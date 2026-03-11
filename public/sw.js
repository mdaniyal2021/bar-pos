const CACHE_NAME = 'bar-pos-v3';

const STATIC_ASSETS = [
    '/pos',
    '/login',
    '/manifest.json',
    '/images/default-product.png',
];

// ===== INSTALL — cache static assets =====
self.addEventListener('install', (event) => {
    console.log('[SW] Installing v3...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets...');
            // Cache one by one so one failure doesn't break all
            return Promise.allSettled(
                STATIC_ASSETS.map(url =>
                    cache.add(url).catch(err => console.log('[SW] Failed to cache:', url, err))
                )
            );
        })
    );
    self.skipWaiting();
});

// ===== ACTIVATE — clean old caches =====
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating v3...');
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

// ===== FETCH =====
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and non-http requests
    if (request.method !== 'GET') return;
    if (!url.protocol.startsWith('http')) return;

    // ---- Images — Cache First (always serve from cache if available) ----
    if (
        url.pathname.startsWith('/images/') ||
        url.pathname.startsWith('/uploads/') ||
        url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
    ) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                // Not in cache — try network and cache it
                return fetch(request.clone())
                    .then(response => {
                        if (response.ok) {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(request, response.clone());
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return empty transparent image as fallback
                        return new Response(
                            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#eee"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999" font-size="12">No Image</text></svg>',
                            { headers: { 'Content-Type': 'image/svg+xml' } }
                        );
                    });
            })
        );
        return;
    }

    // ---- API calls — Network First, cache fallback ----
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request.clone())
                .then(response => {
                    if (response.ok) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, response.clone());
                        });
                    }
                    return response;
                })
                .catch(() => {
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

    // ---- JS/CSS/_next assets — Cache First ----
    if (
        url.pathname.startsWith('/_next/') ||
        url.pathname.match(/\.(js|css|woff|woff2|ttf)$/)
    ) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request.clone()).then(response => {
                    if (response.ok) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, response.clone());
                        });
                    }
                    return response;
                }).catch(() => new Response('', { status: 408 }));
            })
        );
        return;
    }

    // ---- Pages — Network First, cache fallback ----
    event.respondWith(
        fetch(request.clone())
            .then(response => {
                if (response.ok) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, response.clone());
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request).then(cached => {
                    if (cached) return cached;
                    // Fallback to /pos for navigation
                    return caches.match('/pos');
                });
            })
    );
});