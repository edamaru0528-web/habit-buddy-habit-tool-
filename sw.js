const CACHE_NAME = 'habit-tracker-v9.2';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// インストール
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

// アクティベート
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// フェッチ (Network First、ただしAPIリクエストはスキップ)
self.addEventListener('fetch', (event) => {
    // APIリクエスト（JSONBin.io等）はService Workerをスキップ
    const url = new URL(event.request.url);
    if (url.hostname.includes('jsonbin.io') ||
        url.hostname.includes('generativelanguage.googleapis.com') ||
        url.hostname.includes('api.') ||
        event.request.method !== 'GET') {
        // APIリクエストはそのままネットワークに流す（Service Workerはスキップ）
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 正常なレスポンスならキャッシュ更新
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                return response;
            })
            .catch(() => {
                // オフライン時はキャッシュ使用
                return caches.match(event.request);
            })
    );
});
