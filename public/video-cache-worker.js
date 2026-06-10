const CACHE_NAME = "radar-alerta-warning-video-v1";
const WARNING_VIDEO_URL = "https://prefmara.s3.sa-east-1.amazonaws.com/pref.mp4";

const cacheWarningVideo = async () => {
  const cache = await caches.open(CACHE_NAME);
  const cachedVideo = await cache.match(WARNING_VIDEO_URL);

  if (cachedVideo) {
    return cachedVideo;
  }

  const response = await fetch(WARNING_VIDEO_URL, {
    cache: "reload",
    mode: "no-cors",
  });

  await cache.put(WARNING_VIDEO_URL, response.clone());
  return response;
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    cacheWarningVideo()
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.url !== WARNING_VIDEO_URL) {
    return;
  }

  event.respondWith(cacheWarningVideo());
});
