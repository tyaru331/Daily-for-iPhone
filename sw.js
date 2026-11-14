const CACHE_NAME = 'dailyplus-v2.0';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest'
];

// インストール時にアプリの基本ファイルを保存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_FILES);
    })
  );
  self.skipWaiting();
});

// 古いDaily+のキャッシュを整理
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key =>
            key.startsWith('dailyplus-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ページ表示時はキャッシュを利用し、更新も確認
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
