const mount = document.querySelector("[data-dialogue-demo]");

const scene = {
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
      speaker: { id: "community-teacher", pose: "neutral" },
      speakerLabel: "Teacher",
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
  scene,
  onComplete() {
    alert("Dialogue complete. Lesson would begin here.");
  }
});
