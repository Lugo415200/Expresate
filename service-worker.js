/*
 * Exprésate PWA cache.
 * Bump CACHE_VERSION whenever the precache list or a cached asset changes.
 * The activate handler removes every older expresate-static cache.
 */
const CACHE_PREFIX = "expresate-static";
const CACHE_VERSION = "v1";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

// Only these same-origin, user-independent files are cached.
const PRECACHE_PATHS = [
  "./",
  "index.html",
  "curso.html",
  "pricing.html",
  "auth.html",
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
  "curso.js",
  "diccionario.js",
  "juego-comida.js",
  "lesson-001.js",
  "mini-deck.js",
  "verb.js",
  "data/lessons.js",
  "data/quizzes.js",
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
  if (!precacheUrls.has(cacheKey)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, cacheKey));
    return;
  }

  event.respondWith(cacheFirst(request, cacheKey));
});
