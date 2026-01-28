// auth.js
document.addEventListener("DOMContentLoaded", async () => {
  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get("redirect") || "curso.html";

  const modeLogin = document.getElementById("modeLogin");
  const modeSignup = document.getElementById("modeSignup");
  const form = document.getElementById("authForm");
  const emailEl = document.getElementById("email");
  const passEl = document.getElementById("password");
  const submitBtn = document.getElementById("submitBtn");
  const msg = document.getElementById("msg");

  const signedInBox = document.getElementById("signedInBox");
  const userEmail = document.getElementById("userEmail");
  const continueBtn = document.getElementById("continueBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const backLink = document.getElementById("backLink");

  // ✅ Use the same client name everywhere
  const sb = window.supabaseClient;

  if (!sb) {
    showMsg("❌ Supabase no está cargado. Revisa el CDN y supabaseClient.js", true);
    return;
  }

  const safeRedirect = sanitizeRedirect(redirectTo);
  if (backLink) backLink.href = safeRedirect;
  if (continueBtn) continueBtn.addEventListener("click", () => (window.location.href = safeRedirect));

  let mode = "login";
  setMode("login");

  modeLogin?.addEventListener("click", () => setMode("login"));
  modeSignup?.addEventListener("click", () => setMode("signup"));

  // If already signed in, show signed-in UI
  const { data: sessionData } = await sb.auth.getSession();
  updateSignedInUI(sessionData?.session);

  // Keep UI in sync if auth state changes
  sb.auth.onAuthStateChange((_event, session) => {
    updateSignedInUI(session);
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg();

    const email = (emailEl?.value || "").trim();
    const password = passEl?.value || "";

    if (!email || !password) {
      showMsg("⚠️ Escribe tu email y contraseña.", true);
      return;
    }

    submitBtn.disabled = true;

    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;

        showMsg("✅ Sesión iniciada. Redirigiendo…");
        window.location.href = safeRedirect;
        return;
      }

      const { error } = await sb.auth.signUp({ email, password });
      if (error) throw error;

      showMsg("✅ Cuenta creada. Si te pide confirmar por email, revisa tu inbox.");
      // Optional:
      // window.location.href = safeRedirect;
    } catch (err) {
      showMsg(`❌ ${err?.message || "Error desconocido"}`, true);
    } finally {
      submitBtn.disabled = false;
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    hideMsg();
    const { error } = await sb.auth.signOut();
    if (error) showMsg(`❌ ${error.message}`, true);
    else showMsg("✅ Sesión cerrada.");
  });

  function setMode(next) {
    mode = next;

    if (mode === "login") {
      modeLogin?.classList.add("primary");
      modeSignup?.classList.remove("primary");
      submitBtn.textContent = "Entrar";
    } else {
      modeSignup?.classList.add("primary");
      modeLogin?.classList.remove("primary");
      submitBtn.textContent = "Crear cuenta";
    }
  }

  function updateSignedInUI(session) {
    const signedIn = !!session?.user;

    if (signedIn) {
      signedInBox.style.display = "block";
      userEmail.textContent = session.user.email || "usuario";
      form.style.display = "none";
    } else {
      signedInBox.style.display = "none";
      form.style.display = "block";
    }
  }

  function showMsg(text, isError = false) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.display = "block";
    msg.style.borderColor = isError ? "rgba(239,68,68,.4)" : "rgba(255,255,255,.12)";
  }

  function hideMsg() {
    if (!msg) return;
    msg.textContent = "";
    msg.style.display = "none";
  }

  function sanitizeRedirect(r) {
    const cleaned = String(r || "").trim();
    if (cleaned.includes("://") || cleaned.startsWith("//") || cleaned.includes("\\") || cleaned.includes("..")) {
      return "curso.html";
    }
    return cleaned || "curso.html";
  }
});

