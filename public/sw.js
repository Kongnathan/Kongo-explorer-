const CACHE_SHELL_NAME = "kongo-explorer-shell-v3";
const CACHE_IMAGE_NAME = "kongo-explorer-images-v3";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/icon-512.jpg"
];

// Offline Fallback SVG Image when network fails and image is uncached
const OFFLINE_IMAGE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#1b3022"/>
  <path d="M150 280 L250 180 L320 230 L420 130 L500 280 Z" fill="#2d4a36"/>
  <circle cx="210" cy="140" r="28" fill="#f59e0b" opacity="0.8"/>
  <text x="300" y="315" font-family="sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">Kongo Explorer - Photo Hors-Ligne</text>
  <text x="300" y="340" font-family="sans-serif" font-size="13" fill="#a7f3d0" text-anchor="middle">Image disponible dès le retour de la connexion</text>
</svg>
`.trim();

// Install Event - Pre-cache critical application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline shell assets");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_SHELL_NAME, CACHE_IMAGE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (!currentCaches.includes(cache)) {
            console.log("[Service Worker] Removing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper to determine if a request is an image
function isImageRequest(request) {
  if (request.destination === "image") return true;
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();
  const host = url.hostname.toLowerCase();
  
  return (
    path.match(/\.(jpg|jpeg|png|gif|svg|webp|ico|avif)(\?.*)?$/i) ||
    host.includes("googleusercontent.com") ||
    host.includes("postimg.cc") ||
    host.includes("unsplash.com") ||
    host.includes("gstatic.com") ||
    path.includes("image") ||
    path.includes("photo")
  );
}

// Fetch Event - Handle Image CacheStorage and shell caching
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  
  const url = new URL(event.request.url);
  
  // Explicitly NEVER intercept or cache SEO crawler files (robots.txt, sitemap.xml), API routes, or Vite internals
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (
    url.pathname === "/robots.txt" ||
    url.pathname === "/sitemap.xml" ||
    url.pathname.endsWith("/sitemap.xml") ||
    url.pathname.startsWith("/api/") || 
    url.pathname.includes("@vite") || 
    url.pathname.includes("hmr") ||
    url.pathname.includes("vite")
  ) {
    return;
  }

  // 1. STRATEGY FOR IMAGES: CACHE FIRST WITH NETWORK BACKUP & BACKGROUND REVALIDATION
  if (isImageRequest(event.request)) {
    event.respondWith(
      caches.open(CACHE_IMAGE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // If cached, return immediately & trigger background update
          if (cachedResponse) {
            fetch(event.request).then((networkResponse) => {
              if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
            }).catch(() => {/* Silent fail on background update if offline */});
            return cachedResponse;
          }

          // If not in cache, fetch from network and store if valid 200 OK
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Return SVG Fallback Image when offline and not cached
              return new Response(OFFLINE_IMAGE_SVG, {
                status: 200,
                headers: new Headers({
                  "Content-Type": "image/svg+xml",
                  "Cache-Control": "no-store"
                })
              });
            });
        });
      })
    );
    return;
  }

  // 2. STRATEGY FOR HTML / SHELL ASSETS: NETWORK FIRST WITH CACHE FALLBACK
  // Note: NEVER cache navigation or shell error responses (404, 500, etc.)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_SHELL_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === "navigate") {
            return caches.match("/index.html").then((htmlRes) => htmlRes || caches.match("/"));
          }
          return new Response("Hors connexion. Cette ressource n'est pas disponible sans internet.", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/plain; charset=utf-8" })
          });
        });
      })
  );
});
