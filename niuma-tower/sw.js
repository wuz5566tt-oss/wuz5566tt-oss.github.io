/* 牛馬交易上班日｜最小網路優先 Service Worker（相對路徑，可掛在 /niuma-tower/） */
'use strict';

const CACHE = 'niuma-tower-netfirst-v1';
const SCOPE = self.registration.scope;

function isAudioRequest(request, url) {
  if (request.destination === 'audio') return true;
  if (request.headers.has('Range') || request.headers.has('range')) return true;
  return /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(url.pathname);
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const scopePath = new URL(SCOPE).pathname;
  if (!url.pathname.startsWith(scopePath)) return;
  // 音檔與 Range 請求交給瀏覽器，避免循環音樂被截斷
  if (isAudioRequest(event.request, url)) return;

  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request);
      if (fresh && fresh.ok && fresh.type === 'basic') {
        const copy = fresh.clone();
        const cache = await caches.open(CACHE);
        cache.put(event.request, copy);
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw err;
    }
  })());
});
