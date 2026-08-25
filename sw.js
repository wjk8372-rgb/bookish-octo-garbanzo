// Service Worker —— 取件查询 PWA
// 策略：
//   - 应用外壳（HTML/CSS/JS/manifest/图标）：stale-while-revalidate，离线可打开
//   - API 请求：network-first，失败回退缓存（保证离线也能看上次数据）
//   - 不缓存 POST 请求

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `pickup-static-${CACHE_VERSION}`;
const API_CACHE = `pickup-api-${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-512.jpg',
];

// 安装：预缓存应用外壳
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.endsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // POST 请求不缓存（短信推送、运单号反查）
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // API 请求：network-first，失败回退缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // 只缓存成功响应
          if (res.ok) {
            const copy = res.clone();
            caches.open(API_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || new Response(
          '{"ok":false,"error":"offline"}', { headers: { 'Content-Type': 'application/json' } }
        )))
    );
    return;
  }

  // 应用外壳：stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
