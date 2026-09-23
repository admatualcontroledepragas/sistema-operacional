const CACHE_NAME = 'portal-atual-v3'; // Mude sempre a versão aqui quando alterar o código

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './comunicados/index.html',
  './relatorios/index.html'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Força a ativação imediata do novo Service Worker
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Apaga a cache antiga para não acumular lixo
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de rede com prioridade para buscar a versão mais recente
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
