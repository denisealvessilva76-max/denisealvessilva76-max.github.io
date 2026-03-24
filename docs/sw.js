// Service Worker — Canteiro Saudável PWA
// Versão: 2.0.0 — Cache limpo e atualizado

const CACHE_NAME = 'canteiro-saudavel-v2';
const urlsToCache = [
  'index.html',
  'hydration-tracker.html',
  'ergonomia.html',
  'respiracao-guiada.html',
  'blood-pressure-history.html',
  'health-check.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'offline.html'
];

// Instalação — abre novo cache v2
self.addEventListener('install', (event) => {
  console.log('[SW v2] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Ativação — APAGA todos os caches antigos (v1, etc.)
self.addEventListener('activate', (event) => {
  console.log('[SW v2] Ativando — limpando caches antigos...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW v2] Deletando cache antigo:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — Network First: tenta rede, cai no cache só se offline
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') return;
  // Ignora Firebase e APIs externas
  if (event.request.url.includes('firebasedatabase') ||
      event.request.url.includes('firebaseapp') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('offline.html');
          }
        })
      )
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Canteiro Saudável';
  const options = {
    body: data.body || 'Nova notificação',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {}
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
