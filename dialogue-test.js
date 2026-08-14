const mount = document.querySelector("[data-dialogue-demo]");

const scene = {
  background: "assets/backgrounds/classroom/classroom-day.webp",
  location: "English Classroom",
  dialogue: [
    {
      speaker: "sofia",
      pose: "happy",
      text: "Hola, soy Sofía."
    },
    {
      speaker: "sofia",
      pose: "speaking",
      text: "Hoy también es mi primer día aprendiendo inglés."
    },
    {
      speaker: { id: "professor", pose: "neutral" },
      speakerLabel: "Professor",
      text: "Welcome to class. Today we start with the alphabet."
    },
    {
      speaker: "alex",
      pose: "explaining",
      text: "The alphabet helps you spell names, emails, and addresses."
    },
    {
      speaker: "sofia",
      pose: "happy",
      text: "Will you practice with me?"
    }
  ]
};

window.ExpresateDialogueEngine.start({
  mount,
  mode: "scene",
  scene,
  onComplete() {
    alert("Dialogue complete. Lesson would begin here.");
  }
});
