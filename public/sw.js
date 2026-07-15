const CACHE_NAME = "kongo-explorer-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/icon-512.jpg"
];

// Install Event - Pre-cache critical files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline shell assets");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Cache Fallback for robust dynamic sync
self.addEventListener("fetch", (event) => {
  // Only handle standard GET requests
  if (event.request.method !== "GET") return;
  
  const url = new URL(event.request.url);
  
  // Serve only http/https schemes (ignore chrome-extensions, ws, etc.)
  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  
  // Exclude API routes, Vite HMR websocket, and Hot Module Replacement paths
  if (
    url.pathname.startsWith("/api/") || 
    url.pathname.includes("@vite") || 
    url.pathname.includes("hmr") ||
    url.pathname.includes("vite")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If response is valid, clone and update cache
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // For page navigation fallbacks, serve the root document
          if (event.request.mode === "navigate") {
            return caches.match("/");
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
