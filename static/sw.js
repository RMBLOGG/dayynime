/* =====================================================
   DayyNime — Service Worker
   Cache shell statis, fallback offline
   ===================================================== */

var CACHE_NAME = 'dayynime-v1';
var STATIC_ASSETS = [
  '/home',
  '/static/css/style.css',
  '/static/js/main.js',
  '/static/icon.png',
  '/static/no-image.svg',
  'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

/* ── Install: cache static assets ─────────────────── */
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function(err) {
        console.warn('[SW] Gagal cache beberapa asset:', err);
      });
    })
  );
});

/* ── Activate: hapus cache lama ───────────────────── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: network first, fallback ke cache ──────── */
self.addEventListener('fetch', function(e) {
  var req = e.request;

  // Skip non-GET dan request ke API / external
  if (req.method !== 'GET') return;
  if (req.url.includes('/api/') || req.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(req)
      .then(function(res) {
        // Kalau sukses, simpan ke cache (hanya same-origin & CDN tertentu)
        if (res && res.status === 200 && (
          req.url.startsWith(self.location.origin) ||
          req.url.includes('googleapis.com') ||
          req.url.includes('cloudflare.com')
        )) {
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(req, resClone);
          });
        }
        return res;
      })
      .catch(function() {
        // Offline: coba dari cache
        return caches.match(req).then(function(cached) {
          if (cached) return cached;
          // Fallback halaman offline kalau HTML
          if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
            return caches.match('/home');
          }
        });
      })
  );
});
