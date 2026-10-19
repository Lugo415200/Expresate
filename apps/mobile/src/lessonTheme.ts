import { StyleSheet } from "react-native";
import { welcomeColors } from "./WelcomeArtwork";

// Opt-in Lesson 000 surfaces; the welcome/orientation palette is authoritative.
export const lessonColors = {
  ...welcomeColors,
  muted: "#DAD6EC",
  mutedInk: "#646171",
  mutedBorder: "#9691AB",
  error: "#A52B3A",
  errorPaper: "#FFF0EB",
};

export const lessonSurfaces = StyleSheet.create({
  card: { borderRadius: 6, borderWidth: 1.5, borderColor: lessonColors.navy, backgroundColor: lessonColors.ivory, boxShadow: "3px 4px 0px #0B1332" },
  control: { borderRadius: 4, borderWidth: 1.5, borderColor: lessonColors.navy, backgroundColor: lessonColors.ivory, boxShadow: "2px 3px 0px #0B1332" },
  primary: { backgroundColor: lessonColors.yellow },
  disabled: { backgroundColor: lessonColors.muted, borderColor: lessonColors.mutedBorder, boxShadow: "none" },
  disabledInk: { color: lessonColors.mutedInk },
  pressed: { opacity: 0.85, transform: [{ translateX: 1 }, { translateY: 2 }], boxShadow: "1px 1px 0px #0B1332" },
  correct: { backgroundColor: lessonColors.yellow, borderWidth: 2, borderColor: lessonColors.navy },
  incorrect: { backgroundColor: lessonColors.errorPaper, borderWidth: 2, borderColor: lessonColors.error },
});
