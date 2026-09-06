import type { LearningLesson } from "./lesson-contract";
const content = require("./lesson000");
export const lesson000: LearningLesson = {
  id: content.id,
  title: content.title,
  xpReward: content.xpReward,
  blocks: [
    {
      id: "welcome",
      type: "dialogue",
      title: "Bienvenida a clase",
      lines: [
        {
          speaker: "Sofía",
          text: "Hola. Soy Sofía y hoy es mi primer día aprendiendo inglés.",
        },
        {
          speaker: "Sofía",
          text: "¿Tú también estás aquí para empezar conmigo, verdad?",
        },
        {
          speaker: "Profesor",
          text: "Bienvenidos a clase. Hoy empezamos con el alfabeto para compartir información con claridad.",
        },
      ],
    },
    {
      id: "orientation",
      type: "instruction",
      title: "Escucha. Prueba. Avanza.",
      text: "Toca Escuchar para oír una grabación. Practica sin prisa y vuelve a intentarlo cuando lo necesites. Al completar esta lección obtienes 10 XP. Practicar cada día mantiene tu racha.",
    },
    {
      id: "first-listen",
      type: "choice",
      title: "Escucha y encuentra",
      audio: ["a"],
      choices: ["a", "b", "e"],
      answer: "a",
    },
    { id: "alphabet", type: "alphabet", title: "Explora el alfabeto" },
    ...content.recognition.map(
      (r: { target: string; choices: string[] }, i: number) => ({
        id: `recognition-${i}`,
        type: "choice" as const,
        title: "Escucha una letra",
        audio: [r.target],
        choices: r.choices,
        answer: r.target,
      }),
    ),
    ...content.spelling.map(
      (r: { target: string[]; choices: string[] }, i: number) => ({
        id: `sequence-${i}`,
        type: "spelling" as const,
        title: "Construye una secuencia",
        audio: r.target.map((x) => x.toLowerCase()),
        choices: r.choices.map((x) => x.toLowerCase()),
      }),
    ),
    {
      id: "walk",
      type: "spelling",
      title: "Deletrea una palabra",
      audio: ["w", "a", "l", "k"],
      choices: ["w", "a", "l", "k", "m", "t"],
    },
    {
      id: "practical",
      type: "instruction",
      title: "Información exacta",
      text: "Deletrear te ayuda a compartir tu nombre, confirmar una dirección y comunicar usuarios o códigos. No necesitas memorizar todo hoy: escucha y repite.",
    },
    {
      id: "speech",
      type: "speech",
      title: "Ahora, tu nombre",
      text: "Di tu nombre y practica deletrearlo en inglés. Puedes grabarte y escucharte. Esta práctica es opcional; tú comparas tu voz con las letras del alfabeto.",
    },
    {
      id: "sofia",
      type: "dialogue",
      title: "Un último favor…",
      lines: [
        { speaker: "Sofía", text: "Antes de irme… ¿me ayudas con mi nombre?" },
        {
          speaker: "Sofía",
          text: "Quiero ver si puedes reconocer mis letras solo al escucharlas.",
        },
        {
          speaker: "Profesor",
          text: "Escucha con calma. Reconoce cada letra y ayúdala a construir su nombre.",
        },
      ],
    },
    {
      id: "mastery",
      type: "spelling",
      title: "Ayuda a Sofía",
      audio: ["s", "o", "f", "i", "a"],
      choices: ["s", "o", "f", "i", "a", "m", "t", "r", "b", "l"],
      hidden: true,
    },
    {
      id: "completion",
      type: "completion",
      title: "¡Ese es mi nombre! Sofia.",
    },
  ],
};
