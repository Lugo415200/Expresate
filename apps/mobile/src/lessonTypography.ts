import { TextStyle } from "react-native";

/** Native lesson roles. Keep sizes on small phones; reflow the surrounding UI. */
export const lessonType = {
  target: { fontSize: 36, lineHeight: 44, fontWeight: "900" },
  hero: { fontSize: 64, lineHeight: 76, fontWeight: "900" },
  question: { fontSize: 28, lineHeight: 36, fontWeight: "900" },
  instruction: { fontSize: 22, lineHeight: 31, fontWeight: "600" },
  dialogue: { fontSize: 24, lineHeight: 33, fontWeight: "600" },
  answer: { fontSize: 36, lineHeight: 44, fontWeight: "900", includeFontPadding: false },
  button: { fontSize: 22, lineHeight: 29, fontWeight: "800" },
  helper: { fontSize: 18, lineHeight: 26, fontWeight: "600" },
  label: { fontSize: 17, lineHeight: 24, fontWeight: "800" },
} satisfies Record<string, TextStyle>;

export const lessonSpace = { page: 20, gap: 24, tileGap: 12, touch: 64 };
