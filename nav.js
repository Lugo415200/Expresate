/* ============================================================
   nav.js — Shared topbar + sidebar for Exprésate.

   Single source of truth for navigation. Renders content into:
     • every <div class="topbar">       — global topbar w/ brand + profile menu
     • every <aside class="panel sidebar"> — left navigation

   The "active" sidebar item is whichever id === body[data-page].
   Pages without data-page just render with no highlight (still works).

   Load order on every page:
     progress.js  →  nav.js  →  (curso.js)  →  app.js

   To add a nav item: edit NAV_ITEMS below. Don't edit individual HTML files.
   To opt a page out entirely: set <body data-skip-shared-nav="true">.

   The auth.html page uses a custom .panel.auth-side layout (not .panel.sidebar)
   so its content stays untouched. The .topbar is still rendered there so the
   brand stays consistent.
   ============================================================ */
(function () {
  "use strict";

  const BRAND = "Exprésate";

  // Source of truth for the left-nav.
  // To add an item later (e.g., Perfil, Ajustes), append here.
  // premium:true  → renders with .nav-premium class + .premium-badge chip.
  const NAV_ITEMS = [
    { id: "home",        label: "Inicio",      href: "index.html"        },
    { id: "curso",       label: "Curso",       href: "curso.html"        },
    { id: "diccionario", label: "Diccionario", href: "diccionario.html"  },
    { id: "juego",       label: "Juego",       href: "juego-comida.html" },
    { id: "pricing",     label: "Premium",     href: "pricing.html",     premium: true }
  ];

  // Minimal HTML escape so any user-editable BRAND/labels can't break the page.
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderTopbar(target, currentPage) {
    const topLinks = NAV_ITEMS.map((item) => {
      const isActive = item.id === currentPage;
      const classes = ["topbar-nav-link"];
      if (isActive) classes.push("active");
      if (item.premium) classes.push("is-premium");
      return `<a class="${classes.join(" ")}" href="${esc(item.href)}">${esc(item.label)}</a>`;
    }).join("");

    target.innerHTML = `
      <div class="topbar-inner">
        <a class="brand" href="index.html"><strong>${esc(BRAND)}</strong></a>
        <nav class="topbar-nav" aria-label="Navegación principal">
          ${topLinks}
        </nav>
        <div class="topbar-actions">
          <a id="profileBtn" class="topbar-link" type="button" style="display:none;">Perfil ▾</a>
          <div id="profileMenu" class="panel" style="
            display:none; position:absolute; right:16px; top:56px;
            width:260px; padding:12px; z-index:999;
          ">
            <p class="small" style="margin:0 0 10px;">
              Sesión: <strong id="profileEmail">—</strong>
            </p>
            <div class="actions" style="margin:0;">
              <a id="profileLink" class="btn" href="auth.html">Cuenta</a>
              <button id="logoutBtnGlobal" class="btn primary" type="button">Cerrar sesión</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSidebar(target, currentPage) {
    const items = NAV_ITEMS.map((item) => {
      const isActive = item.id === currentPage;
      const activeCls = isActive ? "active" : "";

      // Premium items get a flex layout with label + PRO badge on the right.
      if (item.premium) {
        const cls = [activeCls, "nav-premium"].filter(Boolean).join(" ");
        const labelHtml = isActive
          ? `<strong>✦ ${esc(item.label)}</strong>`
          : `✦ ${esc(item.label)}`;
        return (
          `<a class="${cls}" href="${esc(item.href)}">` +
          `<span>${labelHtml}</span>` +
          `<span class="premium-badge">PRO</span>` +
          `</a>`
        );
      }

      const inner = isActive
        ? `<strong>${esc(item.label)}</strong>`
        : esc(item.label);
      return `<a class="${activeCls}" href="${esc(item.href)}">${inner}</a>`;
    }).join("");

    target.innerHTML = `
      <h3>Navegación</h3>
      <nav class="sidebar">${items}</nav>
    `;
  }

  function init() {
    if (document.body && document.body.dataset.skipSharedNav === "true") return;
    const currentPage = (document.body && document.body.dataset.page) || "";

    document.querySelectorAll("div.topbar").forEach((el) => {
      renderTopbar(el, currentPage);
    });
    // Match only the generic sidebar — leave .panel.auth-side etc. alone.
    document.querySelectorAll("aside.panel.sidebar").forEach((el) => {
      renderSidebar(el, currentPage);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose the config so the curso page (or future tools) can read it.
  window.ExpresateNav = { BRAND, NAV_ITEMS };
})();
