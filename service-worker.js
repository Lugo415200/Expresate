/*
 * Exprésate PWA cache.
 * Bump CACHE_VERSION whenever the precache list or a cached asset changes.
 * The activate handler removes every older expresate-static cache.
 */
const CACHE_PREFIX = "expresate-static";
const CACHE_VERSION = "v19";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

// Only these same-origin, user-independent files are cached.
const PRECACHE_PATHS = [
  "./",
  "index.html",
  "curso.html",
  "pricing.html",
  "auth.html",
  "devices.html",
  "diccionario.html",
  "juego-comida.html",
  "lessons.html",
  "lesson-000-alphabet.html",
  "lesson-001-sounds.html",
  "Syllables.html",
  "lesson-001.html",
  "lesson-002.html",
  "lesson-003.html",
  "lesson-004-greetings.html",
  "lesson-005-classroom-phrases.html",
  "lesson-006-identity-place.html",
  "lesson-007-basic-questions.html",
  "lesson-008-numbers-1-20.html",
  "lesson-009-days-of-week.html",
  "lesson-010-months-dates.html",
  "lesson-011-time-basics.html",
  "lesson-012-food-phrases.html",
  "lesson-013-i-am.html",
  "lesson-014-ing-pattern.html",
  "manifest.json",
  "layout.css",
  "theme-light.css",
  "gamify.css",
  "lesson-flashcard.css",
  "speech-practice.css",
  "home.css",
  "auth.css",
  "devices.css",
  "diccionario.css",
  "juego-comida.css",
  "styles.css",
  "app.js",
  "nav.js",
  "progress.js",
  "alerts.js",
  "access.js",
  "sync.js",
  "supabaseClient.js",
  "lesson.js",
  "speech-practice.js",
  "home.js",
  "auth.js",
  "devices.js",
  "curso.js",
  "diccionario.js",
  "juego-comida.js",
  "lesson-001.js",
  "mini-deck.js",
  "verb.js",
  "data/lessons.js",
  "data/quizzes.js",
  "assets/audio/audio-manifest.json",
  "assets/design/sweetink-gradient-texture.jpg",
  "assets/characters/teacher-guide.png",
  "audio/alphabet/a.mp3",
  "audio/alphabet/b.mp3",
  "audio/alphabet/c.mp3",
  "audio/alphabet/d.mp3",
  "audio/alphabet/e.mp3",
  "audio/alphabet/f.mp3",
  "audio/alphabet/g.mp3",
  "audio/alphabet/h.mp3",
  "audio/alphabet/i.mp3",
  "audio/alphabet/j.mp3",
  "audio/alphabet/k.mp3",
  "audio/alphabet/l.mp3",
  "audio/alphabet/m.mp3",
  "audio/alphabet/n.mp3",
  "audio/alphabet/o.mp3",
  "audio/alphabet/p.mp3",
  "audio/alphabet/q.mp3",
  "audio/alphabet/r.mp3",
  "audio/alphabet/s.mp3",
  "audio/alphabet/t.mp3",
  "audio/alphabet/u.mp3",
  "audio/alphabet/v.mp3",
  "audio/alphabet/w.mp3",
  "audio/alphabet/x.mp3",
  "audio/alphabet/y.mp3",
  "audio/alphabet/z.mp3",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png"
];

const precacheUrls = new Set(
  PRECACHE_PATHS.map((path) => new URL(path, self.registration.scope).href)
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(Array.from(precacheUrls)))
      .then(async () => {
        const cache = await caches.open(CACHE_NAME);
        const manifestUrl = new URL("assets/audio/audio-manifest.json", self.registration.scope).href;
        const response = await cache.match(manifestUrl);
        if (!response) return;
        const manifest = await response.json();
        const audioUrls = Object.values(manifest.entries || {})
          .map((entry) => entry?.path)
          .filter(Boolean)
          .map((audioPath) => new URL(audioPath, self.registration.scope).href);
        if (audioUrls.length) await cache.addAll(audioUrls);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(`${CACHE_PREFIX}-`) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function normalizedPrecacheUrl(requestUrl) {
  const url = new URL(requestUrl);
  url.search = "";
  url.hash = "";
  return url.href;
}

async function networkFirst(request, cacheKey) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(cacheKey, response.clone());
    return response;
  } catch {
    return (await cache.match(cacheKey)) || Response.error();
  }
}

async function cacheFirst(request, cacheKey) {
  const cached = await caches.match(cacheKey);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(cacheKey, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Supabase, CDNs, Google Fonts, and every other external origin stay network-only.
  if (url.origin !== self.location.origin) return;

  const cacheKey = normalizedPrecacheUrl(url.href);
  const isGeneratedAudio = /\/assets\/audio\/(letters|words|phrases|lesson-intros)\/.+\.mp3$/i.test(url.pathname);

  // Only manifest-listed MP3 files are installed in the cache. Other audio
  // paths remain network-only if they are not already present there.
  if (isGeneratedAudio) {
    event.respondWith(caches.match(cacheKey).then((cached) => cached || fetch(request)));
    return;
  }

  if (!precacheUrls.has(cacheKey)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, cacheKey));
    return;
  }

  event.respondWith(cacheFirst(request, cacheKey));
});
