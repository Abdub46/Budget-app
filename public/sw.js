/**
 * Minimal service worker for PWA offline support.
 *
 * Deliberately conservative for a finance app:
 * - NEVER caches anything under /api/ — financial data must always come
 *   from the network, never served stale or persisted in Cache Storage.
 * - NEVER caches authenticated HTML pages — only the static app shell
 *   (JS/CSS bundles, icons, manifest) and a dedicated /offline fallback.
 * - Navigation requests always try the network first; the cached
 *   /offline page is only shown if the network is unreachable.
 *
 * Bump CACHE_VERSION whenever the precache list changes so old caches get
 * cleaned up on activate.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `budget-app-shell-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/offline',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('budget-app-shell-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/favicon.png' ||
    url.pathname === '/apple-touch-icon.png'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests — everything else (POST/PATCH/
  // DELETE, cross-origin calls like the AI provider or Resend) passes
  // straight through untouched.
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Never intercept API routes — always hit the network so financial data
  // is never served stale or stored in Cache Storage.
  if (isApiRequest(url)) {
    return;
  }

  // Page navigations: network-first, falling back to the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline').then((cached) => cached ?? Response.error())
      )
    );
    return;
  }

  // Static, versioned build assets and icons: cache-first (they're
  // content-hashed by Next.js, so a cache hit is always correct), with a
  // network fallback that also updates the cache.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }

  // Everything else: leave to the browser's default handling.
});