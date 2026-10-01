// Service worker minimo: necessario para o Chrome oferecer a instalacao do site.
// Estrategia: network-first (a app depende de dados em tempo real), com o
// app shell em cache apenas como recurso de recurso quando a rede falha.

const CACHE = 'heritage-hunt-v6';
const SHELL = [
    './',
    './index.html',
    './styles.css',
    './manifest.webmanifest',
    './imagens/icons/icon-192.png',
    './imagens/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(SHELL))
            .catch(() => {})
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(req)
            .then((res) => {
                const copy = res.clone();
                caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
                return res;
            })
            .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
});
