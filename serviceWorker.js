let currentPath = self.location.href.replace("/serviceWorker.js", "");

const cacheName = "smart-home-v1"
const assets = [
    "/",
    "/index.html",
    "/devices/smart-lamp.html",
    "/devices/smart-lamp.js",
    "/scripts/global.js",
    "/scripts/mqtt.js"
].map(url => currentPath + url)

self.addEventListener("install", installEvent => {
    installEvent.waitUntil(
        caches.open(cacheName).then(cache => {
            cache.addAll(assets)
        })
    )
});

self.addEventListener("fetch", fetchEvent => {
    fetchEvent.respondWith(
        caches.match(fetchEvent.request).then(res => {
            return res || fetch(fetchEvent.request)
        })
    )
})