(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async () => {
    const list = document.getElementById("deviceList");
    const message = document.getElementById("deviceMessage");
    const count = document.getElementById("deviceCount");
    const returnLink = document.getElementById("deviceReturn");

    const params = new URLSearchParams(window.location.search);
    const returnTo = window.Access?.sanitizeRedirect?.(params.get("from"), "curso.html") || "curso.html";
    if (returnLink) returnLink.href = returnTo;

    if (!window.Access) {
      setMessage("No se pudo cargar la administración de dispositivos.", true);
      return;
    }

    await Access.ready();
    if (!Access.isLoggedIn()) {
      window.location.replace(Access.loginUrl(`devices.html?from=${encodeURIComponent(returnTo)}`));
      return;
    }

    try {
      render(await Access.refreshDevices());
    } catch (error) {
      setMessage(error?.message || "No se pudieron cargar tus dispositivos.", true);
    }

    list?.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-deactivate-device]");
      if (!button) return;
      const deviceId = button.getAttribute("data-deactivate-device");
      if (!deviceId || !window.confirm("¿Desactivar este dispositivo? Premium quedará bloqueado allí si vuelve a usarse.")) return;

      button.disabled = true;
      try {
        render(await Access.deactivateDevice(deviceId));
        window.Alerts?.success?.("Dispositivo desactivado.");
      } catch (error) {
        setMessage(error?.message || "No se pudo desactivar el dispositivo.", true);
        button.disabled = false;
      }
    });

    function render(state) {
      if (count) count.textContent = String(state.activeCount ?? 0);
      if (!list) return;
      list.replaceChildren();

      if (state.status === "unavailable") {
        setMessage("El registro de dispositivos todavía no está disponible. Tu acceso Premium no se bloqueará.", true);
        return;
      }

      if (state.status === "bypassed") {
        setMessage("El límite está desactivado durante pruebas locales.");
        return;
      }

      if (!Access.hasPremiumSubscription()) {
        setMessage("Las cuentas gratuitas no tienen límite de dispositivos.");
      } else if (state.status === "limited") {
        setMessage("Este dispositivo supera el límite Premium. Desactiva un dispositivo anterior para continuar.", true);
      } else if (state.activeCount > state.maxDevices) {
        setMessage("Este dispositivo conserva acceso Premium. Otro dispositivo está fuera del límite.");
      } else {
        setMessage("Tus dispositivos activos están dentro del límite.");
      }

      const ordered = [...state.devices].sort((a, b) => Number(b.is_active) - Number(a.is_active));
      for (const device of ordered) list.append(createDeviceCard(device));
      if (!ordered.length) setMessage("No hay dispositivos registrados todavía.");
    }

    function createDeviceCard(device) {
      const card = document.createElement("article");
      card.className = `device-card${device.is_current ? " is-current" : ""}${device.is_active ? "" : " is-inactive"}`;

      const copy = document.createElement("div");
      copy.className = "device-copy";
      const name = document.createElement("strong");
      name.className = "device-name";
      name.textContent = device.device_name || "Dispositivo";
      const meta = document.createElement("span");
      meta.className = "device-meta";
      meta.textContent = `Último uso: ${formatDate(device.last_seen)}`;
      const badges = document.createElement("div");
      badges.className = "device-badges";
      if (device.is_current) badges.append(makeBadge("Este dispositivo"));
      if (device.is_allowed) badges.append(makeBadge("Premium permitido"));
      if (!device.is_active) badges.append(makeBadge("Inactivo"));
      copy.append(name, meta, badges);
      card.append(copy);

      if (device.is_active && !device.is_current) {
        const button = document.createElement("button");
        button.className = "btn";
        button.type = "button";
        button.textContent = "Desactivar";
        button.setAttribute("data-deactivate-device", device.device_id);
        card.append(button);
      }
      return card;
    }

    function makeBadge(text) {
      const badge = document.createElement("span");
      badge.className = "device-badge";
      badge.textContent = text;
      return badge;
    }

    function formatDate(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? "sin fecha"
        : new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
    }

    function setMessage(text, warning = false) {
      if (!message) return;
      message.textContent = text;
      message.classList.toggle("is-warning", warning);
    }
  });
})();
