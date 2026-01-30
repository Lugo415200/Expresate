// ===============================
// lesson-001.js — PRACTICE + CLICK BUILDER
// ===============================

console.log("lesson-001.js loaded ✅");

function normalizeAnswer(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[“”"]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "");
}

/* ===============================
   INPUT PRACTICE (typed answers)
   =============================== */

function checkItem(item) {
  const input = item.querySelector("input.answer");
  const feedback = item.querySelector(".feedback");
  const expected = item.getAttribute("data-answer") || "";
  const user = input.value;

  if (!user.trim()) {
    feedback.className = "feedback bad";
    feedback.textContent = "Escribe tu respuesta primero.";
    return false;
  }

  const ok = normalizeAnswer(user) === normalizeAnswer(expected);

  feedback.className = `feedback ${ok ? "ok" : "bad"}`;
  feedback.textContent = ok ? "✅ Correcto" : `❌ Incorrecto. Respuesta: ${expected}`;

  item.dataset.status = ok ? "ok" : "bad";
  return ok;
}

function resetItem(item) {
  item.querySelector("input.answer").value = "";
  const feedback = item.querySelector(".feedback");
  feedback.className = "feedback";
  feedback.textContent = "";
  delete item.dataset.status;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".check-btn");
  if (btn) {
    checkItem(btn.closest(".practice-item"));
    return;
  }

  const checkAll = e.target.closest("#checkAll");
  if (checkAll) {
    checkAll
      .closest(".practice")
      .querySelectorAll(".practice-item")
      .forEach(checkItem);
    return;
  }

  const reset = e.target.closest("#resetPractice");
  if (reset) {
    reset
      .closest(".practice")
      .querySelectorAll(".practice-item")
      .forEach(resetItem);
    return;
  }
});

// Enter key checks current item
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const input = e.target.closest("input.answer");
  if (!input) return;
  e.preventDefault();
  checkItem(input.closest(".practice-item"));
});

/* ===============================
   CLICK-TO-PLACE SENTENCE BUILDER
   =============================== */

document.addEventListener("DOMContentLoaded", () => {
  const bank = document.getElementById("bank");
  const sentence = document.getElementById("sentence");
  const checkBtn = document.getElementById("checkBuild");
  const resetBtn = document.getElementById("resetBuild");
  const msg = document.getElementById("buildMsg");

  // If this lesson doesn't have the builder, do nothing.
  if (!bank || !sentence || !checkBtn || !resetBtn || !msg) {
    console.log("Builder not found on this page (ok).");
    return;
  }

  const chips = [...document.querySelectorAll(".dnd-chip")];
  const slots = [...document.querySelectorAll(".dnd-slot")];

  console.log("Builder ready ✅ chips:", chips.length, "slots:", slots.length);

  const slotLabel = (slot) =>
    slot.dataset.slot === "0" ? "Sujeto" :
    slot.dataset.slot === "1" ? "Verbo" :
    slot.dataset.slot === "2" ? "Complemento" :
    "Tiempo";

  const nextEmptySlot = () => slots.find(s => !s.classList.contains("filled"));

  // Click chip -> fill next empty slot
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      if (chip.disabled) return;

      const slot = nextEmptySlot();
      if (!slot) return;

      const word = chip.dataset.word || chip.textContent.trim();

      slot.textContent = word;
      slot.dataset.word = word;
      slot.classList.add("filled");

      chip.disabled = true;
      chip.classList.add("used");
    });
  });

  // Click slot -> remove word and re-enable chip
  slots.forEach((slot) => {
    slot.addEventListener("click", () => {
      if (!slot.classList.contains("filled")) return;

      const word = slot.dataset.word;

      slot.classList.remove("filled");
      slot.textContent = slotLabel(slot);
      delete slot.dataset.word;

      const chip = chips.find(c => (c.dataset.word || c.textContent.trim()) === word);
      if (chip) {
        chip.disabled = false;
        chip.classList.remove("used");
      }
    });
  });

  // Reset builder
  resetBtn.addEventListener("click", () => {
    slots.forEach((slot) => {
      slot.classList.remove("filled");
      slot.textContent = slotLabel(slot);
      delete slot.dataset.word;
    });

    chips.forEach((chip) => {
      chip.disabled = false;
      chip.classList.remove("used");
    });

    msg.textContent = "";
  });

  // Check builder answer
  checkBtn.addEventListener("click", () => {
    const built = slots
      .map(s => (s.dataset.word || "").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const correct = "I run every day";

    msg.textContent =
      normalizeAnswer(built) === normalizeAnswer(correct)
        ? "✅ Correcto!"
        : `❌ Tu oración: "${built}"`;
  });
});



