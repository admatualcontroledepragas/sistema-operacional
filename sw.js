const CACHE_NAME = 'portal-atual-v102'; // Versão atualizada com módulo Orçamentos

const urlsToCache = [
  // Ficheiros da Raiz (Portal)
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  
  // Módulo: Recibos
  './recibos/index.html',
  './recibos/stylebase.css',
  './recibos/stylemobile.css',
  './recibos/styledesktop.css',
  './recibos/script-utils.js',
  './recibos/script-ui.js',
  './recibos/script-api.js',

  // Módulo: Relatórios e Certificados
  './relatorios/index.html',
  './relatorios/stylebase.css',
  './relatorios/stylemobile.css',
  './relatorios/styledesktop.css',
  './relatorios/script.js',

  // Módulo: Comunicados
  './comunicados/index.html',
  './comunicados/stylebase.css',
  './comunicados/stylemobile.css',
  './comunicados/styledesktop.css',
  './comunicados/script.js',
  
  // Módulo: Orçamentos (NOVO)
  './orcamentos/index.html',
  './orcamentos/stylebase.css',
  './orcamentos/stylemobile.css',
  './orcamentos/styledesktop.css',
  './orcamentos/script.js',

  // Módulo: Contratos
  './contratos/index.html',
  './contratos/stylebase.css',
  './contratos/stylemobile.css',
  './contratos/styledesktop.css',
  './contratos/script.js',

  // Módulo: Comprovantes de Execução
  './comprovantes/index.html',
  './comprovantes/stylebase.css',
  './comprovantes/stylemobile.css',
  './comprovantes/styledesktop.css',
  './comprovantes/script.js',

  // Módulo: Cronogramas
  './cronogramas/index.html',
  './cronogramas/stylebase.css',
  './cronogramas/stylemobile.css',
  './cronogramas/styledesktop.css',
  './cronogramas/script.js'
];

// Instalação do Service Worker e ativação imediata
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('A guardar ficheiros no cache...');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação e limpeza de caches antigos para evitar lixo na memória
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('A limpar cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de rede (Estratégia: Network First, Fallback to Cache)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
