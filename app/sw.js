// Service worker: primero la red (siempre la última versión); sin internet, lo último que se guardó.
// Los pedidos a Supabase (datos y sesión) nunca se guardan acá.
const CACHE = 'mi-dia-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || /supabase\.co/.test(req.url) || !/^https?:/.test(req.url)) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
