/* ============================================================
   alerts.js — Global toast/alert system for Exprésate
   No dependencies — load before nav.js, app.js, and any
   page-specific scripts so it is available immediately.

   Public API  (window.Alerts):
     Alerts.show(message, type, options)
     Alerts.success(msg, opts)
     Alerts.error(msg, opts)
     Alerts.warning(msg, opts)
     Alerts.info(msg, opts)
     Alerts.premium(msg, opts)
     Alerts.dismiss(toastEl)

   Options object:
     { duration: <ms> }   — auto-dismiss delay. Default 4 000 ms.
                             Pass 0 to keep the toast until closed.

   Defensive guarantee:
     Every call is wrapped in try/catch — a broken alert must
     never crash the rest of the page.
   ============================================================ */

(function () {
  "use strict";

  var CONTAINER_ID  = "expresate-alerts";
  var DEFAULT_MS    = 4000;
  var reducedMotion = (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  var ICONS = {
    success: "✓",   /* ✓ */
    error:   "✕",   /* ✕ */
    warning: "⚠",   /* ⚠ */
    info:    "ℹ",   /* ℹ */
    premium: "★"    /* ★ */
  };

  /* ── Container — created once, appended to <body> ── */
  function getContainer() {
    var el = document.getElementById(CONTAINER_ID);
    if (!el) {
      el = document.createElement("div");
      el.id = CONTAINER_ID;
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", "Notificaciones");
      /* Append only when body is available */
      if (document.body) {
        document.body.appendChild(el);
      }
    }
    return el;
  }

  /* ── Core: build and display one toast ── */
  function show(message, type, options) {
    try {
      if (!message) return null;
      if (!ICONS[type]) type = "info";
      options = options || {};
      var duration = typeof options.duration === "number"
        ? options.duration
        : DEFAULT_MS;

      var container = getContainer();
      if (!container) return null;

      /* Build DOM */
      var toast = document.createElement("div");
      toast.className = "al-toast al-" + type;
      toast.setAttribute("role", "alert");
      toast.setAttribute("aria-atomic", "true");

      var icon = document.createElement("span");
      icon.className = "al-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = ICONS[type];

      var body = document.createElement("span");
      body.className = "al-body";
      body.textContent = String(message);

      var close = document.createElement("button");
      close.className = "al-close";
      close.type = "button";
      close.setAttribute("aria-label", "Cerrar notificación");
      close.innerHTML = "&#x2715;";

      toast.appendChild(icon);
      toast.appendChild(body);
      toast.appendChild(close);
      container.appendChild(toast);

      /* Trigger CSS enter animation on the next two paint frames */
      var raf1 = null;
      if (reducedMotion) {
        toast.classList.add("al-visible");
      } else {
        raf1 = requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            toast.classList.add("al-visible");
          });
        });
      }

      /* Auto-dismiss */
      var timer = null;
      if (duration > 0) {
        timer = setTimeout(function () { dismiss(toast); }, duration);
      }

      /* Close button */
      close.addEventListener("click", function () {
        if (raf1) cancelAnimationFrame(raf1);
        clearTimeout(timer);
        dismiss(toast);
      });

      return toast;
    } catch (err) {
      /* Alerts must never crash the page */
      try { console.warn("[Alerts] show() threw:", err); } catch (_) {}
      return null;
    }
  }

  /* ── Dismiss: play exit animation then remove ── */
  function dismiss(toast) {
    try {
      if (!toast || toast._alClosing) return;
      toast._alClosing = true;
      toast.classList.remove("al-visible");
      toast.classList.add("al-out");
      var delay = reducedMotion ? 0 : 320;
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, delay);
    } catch (err) {
      try { console.warn("[Alerts] dismiss() threw:", err); } catch (_) {}
    }
  }

  /* ── Public API ── */
  window.Alerts = {
    show:    show,
    dismiss: dismiss,
    success: function (msg, opts) { return show(msg, "success", opts); },
    error:   function (msg, opts) { return show(msg, "error",   opts); },
    warning: function (msg, opts) { return show(msg, "warning", opts); },
    info:    function (msg, opts) { return show(msg, "info",    opts); },
    premium: function (msg, opts) { return show(msg, "premium", opts); }
  };

})();
