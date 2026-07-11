/* vision PWA — production only (do not use with Vite HMR) */
const CACHE = "vision-static-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache Vite dev / HMR endpoints
  if (
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.includes("node_modules")
  ) {
    return;
  }

  // Navigations: network only (avoid stale shell → black screen)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cached = await caches.match("/index.html");
        return (
          cached ||
          new Response(
            "<!doctype html><title>vision</title><body style='background:#0e0a14;color:#f4eef8;font-family:system-ui;padding:2rem'><h1>vision offline</h1><p>Open this app while on the same Wi‑Fi as your computer, or use a deployed HTTPS link.</p></body>",
            { headers: { "Content-Type": "text/html" } },
          )
        );
      }),
    );
    return;
  }

  // Built assets: cache after first successful fetch
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
  }
});
