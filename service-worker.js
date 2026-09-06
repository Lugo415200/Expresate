/*
 * Exprésate PWA cache.
 * Bump CACHE_VERSION whenever the precache list or a cached asset changes.
 * The activate handler removes every older expresate-static cache.
 */
const CACHE_PREFIX = "expresate-static";
const CACHE_VERSION = "v76";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

// Only these same-origin, user-independent files are cached.
const PRECACHE_PATHS = [
  "./",
  "index.html",
  "curso.html",
  "pricing.html",
  "auth.html",
  "admin.html",
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
  "lesson.html",
  "manifest.json",
  "layout.css",
  "theme-light.css",
  "gamify.css",
  "lesson-flashcard.css",
  "dialogue-engine.css",
  "lesson-renderer.css",
  "lesson-live.css",
  "speech-practice.css",
  "home.css",
  "auth.css",
  "admin.css",
  "devices.css",
  "diccionario.css",
  "juego-comida.css",
  "styles.css",
  "app.js",
  "nav.js",
  "progress.js",
  "shared/progress-core.js",
  "shared/lesson000.js",
  "alerts.js",
  "access.js",
  "sync.js",
  "supabaseClient.js",
  "lesson.js",
  "dialogue-engine.js",
  "lesson-live.js",
  "speech-practice.js",
  "home.js",
  "auth.js",
  "admin.js",
  "devices.js",
  "curso.js",
  "diccionario.js",
  "juego-comida.js",
  "lesson-001.js",
  "mini-deck.js",
  "verb.js",
  "data/lessons.js",
  "data/lesson-audio-readiness.js",
  "data/lesson000-letters.js",
  "data/studio-media-library.js",
  "data/studio-vocabulary.js",
  "data/studio-lessons.js",
  "data/studio-publishing.js",
  "data/studio-experiences.js",
  "data/studio-themes.js",
  "data/studio-activities.js",
  "data/studio-animations.js",
  "data/studio-characters.js",
  "data/studio-story-scenes.js",
  "data/studio-lesson-renderer.js",
  "data/quizzes.js",
  "assets/audio/audio-manifest.json",
  "assets/video/orientation/escuchar-demo.mp4",
  "assets/video/orientation/hablar-demo.mp4",
  "assets/video/orientation/consejo-demo.mp4",
  "assets/video/orientation/xp-demo.mp4",
  "assets/video/orientation/racha-demo.mp4",
  "assets/video/orientation/completado-demo.mp4",
  "assets/design/sweetink-gradient-texture.jpg",
  "assets/characters/teacher-guide.png",
  "assets/backgrounds/classroom/classroom-day.webp",
  "assets/characters/sofia/happy.webp",
  "assets/characters/professor/neutral.webp",
  "assets/characters/letter-a-animals.png",
  "assets/characters/letter-b-birds.png",
  "assets/characters/letter-c-cat.png",
  "assets/characters/letter-c-city.png",
  "assets/characters/letter-e-egg.png",
  "assets/characters/letter-e-elephant.png",
  "assets/characters/letter-e-evening.png",
  "assets/textures/paper-black.jpg",
  "assets/textures/paper-blue.jpg",
  "assets/textures/paper-green.jpg",
  "assets/textures/paper-red.jpg",
  "assets/textures/paper-tosca.jpg",
  "assets/textures/paper-white.jpg",
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

  // Recording availability changes independently from the static shell. Keep
  // the last good manifest for offline use, but refresh it whenever possible.
  if (url.pathname.endsWith("/assets/audio/audio-manifest.json")) {
    event.respondWith(networkFirst(request, cacheKey));
    return;
  }

  // Explorer artwork is requested as the learner opens individual letters.
  // Cache each image after its first successful fetch instead of precaching
  // the full A-Z collection during service-worker installation.
  if (url.pathname.includes("/assets/alphabet/examples/") && request.destination === "image") {
    event.respondWith(cacheFirst(request, cacheKey));
    return;
  }

  if (!precacheUrls.has(cacheKey)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, cacheKey));
    return;
  }

  // App code must update promptly after a deployment. Keep the cached version
  // strictly as an offline fallback instead of serving stale JavaScript or CSS.
  if (request.destination === "script" || request.destination === "style") {
    event.respondWith(networkFirst(request, cacheKey));
    return;
  }

  event.respondWith(cacheFirst(request, cacheKey));
});
