const CACHE_NAME = "elevateu-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192.jpg",
  "/icon-512.jpg"
];

// Install Event - Pre-cache Shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[PWA SW] Pre-caching Core Shell...");
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[PWA SW] Clearing old cache bundle:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic routing and Offline adaptation
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // 1. Skip caching non-GET requests or Firebase-specific analytics calls
  if (e.request.method !== "GET" || url.origin !== self.location.origin) {
    // For API POST requests (e.g., chat/generate-plan) if they go offline, return a friendly JSON response
    if (e.request.method === "POST" && url.pathname.includes("/api/")) {
      e.respondWith(
        fetch(e.request).catch(() => {
          return new Response(
            JSON.stringify({
              error: "COACH CORE MODULE OFFLINE. System is running on battery-backup offline mode. Restore connectivity to access full AI analytics, or proceed with compiling static tasks!",
              offline: true
            }),
            {
              headers: { "Content-Type": "application/json" }
            }
          );
        })
      );
    }
    return;
  }

  // 2. Map navigation requests (HTML page reloads on different routes) back to index.html
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).catch(() => {
        return caches.match("/index.html") || caches.match("/");
      })
    );
    return;
  }

  // 3. Asset recovery (Cache First for assets, but check network to refresh them or fallback if offline)
  const isWebAsset = 
    url.pathname.endsWith(".js") || 
    url.pathname.endsWith(".css") || 
    url.pathname.endsWith(".svg") || 
    url.pathname.endsWith(".png") || 
    url.pathname.endsWith(".jpg") || 
    url.pathname.endsWith(".woff") || 
    url.pathname.endsWith(".woff2") ||
    url.pathname.includes("@vite");

  if (isWebAsset) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache but fetch fresh in background to update cache (Stale-While-Revalidate)
          fetch(e.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
            }
          }).catch(() => {/* Ignore background fetch failures offline */});
          
          return cachedResponse;
        }

        // Fetch from network and store in cache
        return fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
          }
          return networkResponse;
        }).catch(() => {
          // Fallback if resource not available offline
          if (url.pathname.endsWith(".svg")) {
            return caches.match("/icon.svg");
          }
        });
      })
    );
    return;
  }

  // 4. Default standard strategy: Network First (or Fallback to cache)
  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          // Map default fallback for text files / other routes
          const acceptHeader = e.request.headers.get("accept") || "";
          if (acceptHeader.includes("text/html")) {
            return caches.match("/index.html");
          }
        });
      })
  );
});

// Push notification hook for future engagement mechanics
self.addEventListener("push", (e) => {
  let payload = { title: "ElevateU Academic Quest", body: "A new academic recovery bulletin has been deployed!" };
  try {
    if (e.data) {
      payload = e.data.json();
    }
  } catch (err) {
    if (e.data) {
       payload.body = e.data.text();
    }
  }
  
  const options = {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "pwa-notification"
    },
    actions: [
      { action: "explore", title: "Open Dashboard" }
    ]
  };

  e.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});
