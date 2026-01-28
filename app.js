const STORAGE_KEY = "ynoel_english_progress_v1";

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function setCompleted(lessonId, completed) {
  const progress = loadProgress();
  progress[lessonId] = { completed: !!completed, ts: Date.now() };
  saveProgress(progress);
}

function isCompleted(lessonId) {
  const progress = loadProgress();
  return !!progress?.[lessonId]?.completed;
}

document.addEventListener("DOMContentLoaded", () => {
  // Footer year (if present)
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

    // =========================
  // Profile menu + logout (global)
  // =========================
  const sb = window.supabaseClient; // from supabaseClient.js
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const profileEmail = document.getElementById("profileEmail");
  const logoutBtnGlobal = document.getElementById("logoutBtnGlobal");

  // current page for redirect (index.html, curso.html, etc.)
  const redirectUrl = window.location.pathname.split("/").pop() || "index.html";

  // if the HTML elements aren't on this page, skip
  if (profileBtn && profileMenu) {
    // Always show the button (we change label based on login)
    profileBtn.style.display = "inline-flex";

    // If Supabase isn't loaded on this page, fallback to auth page
    if (!sb) {
      profileBtn.textContent = "Iniciar sesión";
      profileBtn.addEventListener("click", () => {
        window.location.href = `auth.html?redirect=${encodeURIComponent(redirectUrl)}`;
      });
    } else {
      // On load, check session
      sb.auth.getSession().then(({ data }) => {
        updateProfileUI(data?.session);
      });

      // Keep updated
      sb.auth.onAuthStateChange((_event, session) => {
        updateProfileUI(session);
      });

      // Toggle menu ONLY when logged in
      profileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (profileBtn.dataset.state !== "signed-in") {
          window.location.href = `auth.html?redirect=${encodeURIComponent(redirectUrl)}`;
          return;
        }
        profileMenu.style.display = (profileMenu.style.display === "block") ? "none" : "block";
      });

      // Close when clicking outside
      document.addEventListener("click", () => {
        profileMenu.style.display = "none";
      });

      // Logout
      logoutBtnGlobal?.addEventListener("click", async () => {
        try {
          await sb.auth.signOut();
          profileMenu.style.display = "none";
          window.location.href = "index.html";
        } catch (err) {
          console.error("Logout failed:", err);
        }
      });
    }
  }

  function updateProfileUI(session) {
    const signedIn = !!session?.user;

    if (!profileBtn || !profileMenu) return;

    if (signedIn) {
      profileBtn.textContent = "Perfil ▾";
      profileBtn.dataset.state = "signed-in";
      if (profileEmail) profileEmail.textContent = session.user.email || "usuario";
    } else {
      profileBtn.textContent = "Iniciar sesión";
      profileBtn.dataset.state = "logged-out";
      profileMenu.style.display = "none";
      if (profileEmail) profileEmail.textContent = "—";
    }
  }


    // =========================
  // Audio buttons (alphabet + custom)
  // =========================
  const player = new Audio();
  player.preload = "auto";

  // Optional: stop any current audio when leaving page
  window.addEventListener("beforeunload", () => {
    try {
      player.pause();
      player.currentTime = 0;
    } catch {}
  });

  document.addEventListener("click", (e) => {
    // 0) Works for vowel buttons and any button with data-audio
    const anyAudio = e.target.closest("[data-audio]");
    if (anyAudio) {
      const src = (anyAudio.getAttribute("data-audio") || "").trim();
      if (!src) return;
      playSrc(src);
      return;
    }
    // 1) Alphabet letters: <button class="letter-btn" data-letter="a">A</button>
    const letterBtn = e.target.closest(".letter-btn");
    if (letterBtn) {
      const letter = (letterBtn.dataset.letter || "").toLowerCase().trim();
      if (!letter) return;

      const src = `audio/alphabet/${letter}.mp3`;
      playSrc(src);
      return;
    }

    // 2) Custom audio: <button class="audio-btn" data-audio="audio/words/eat.mp3">🔊</button>
    const audioBtn = e.target.closest(".audio-btn");
    if (audioBtn) {
      const src = (audioBtn.dataset.audio || "").trim();
      if (!src) return;

      playSrc(src);
      return;
    }
  });

  function playSrc(src) {
    // reset and play new source
    try {
      player.pause();
      player.currentTime = 0;
      player.src = src;
      player.play().catch((err) => {
        console.error("Audio play blocked or failed:", src, err);
      });
    } catch (err) {
      console.error("Audio error:", src, err);
    }
  }

  // Lesson page: wire up completion button
  const lessonId = document.body.dataset.lessonId; // requires: <body data-lesson-id="template-001">
  const completeBtn = document.getElementById("markComplete");
  const status = document.getElementById("lessonStatus");

  if (lessonId && completeBtn) {
    const refresh = () => {
      const done = isCompleted(lessonId);

      // Spanish UI text
      completeBtn.textContent = done ? "Completada ✅" : "Marcar como completada";
      if (status) {
        status.textContent = done
          ? "Estado: Completada ✅"
          : "Estado: No completada todavía";
      }

      // Style: primary when not done
      completeBtn.classList.toggle("primary", !done);
    };

    completeBtn.addEventListener("click", () => {
      const done = isCompleted(lessonId);
      setCompleted(lessonId, !done);
      refresh();
    });

    refresh();
  }

  // Lessons page: show completed badges
  document.querySelectorAll("[data-progress-id]").forEach((el) => {
    const id = el.getAttribute("data-progress-id");
    if (isCompleted(id)) {
      el.classList.add("done");

      // Prevent duplicates if you refresh multiple times
      if (!el.querySelector(".doneBadge")) {
        const badge = document.createElement("span");
        badge.className = "doneBadge";
        badge.textContent = "Completada ✅";
        el.appendChild(badge);
      }
    }
  });
});
