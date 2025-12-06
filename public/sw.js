// Placeholder service worker to silence /sw.js 404s.
// Extend with caching/offline logic if a PWA is needed.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
