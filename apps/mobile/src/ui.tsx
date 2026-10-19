import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { lessonType, lessonSpace } from "./lessonTypography";
export const colors = {
  ink: "#0f172a",
  muted: "#475569",
  blue: "#4358f4",
  pale: "#e9edff",
  paper: "#f3f5fb",
  line: "#dce3f0",
  green: "#23764d",
  white: "#ffffff",
};
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
  readable = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  readable?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        readable && { minHeight: lessonSpace.touch, paddingVertical: 16 },
        secondary && s.secondary,
        (disabled || pressed) && { opacity: 0.55 },
      ]}
    >
      <Text style={[s.buttonText, readable && lessonType.button, secondary && { color: colors.blue }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Card({ children }: React.PropsWithChildren) {
  return <View style={s.card}>{children}</View>;
}
export function Loading({ title = "Preparando tu clase…" }) {
  return (
    <View style={s.center}>
      <ActivityIndicator color={colors.blue} />
      <Text style={s.body}>{title}</Text>
    </View>
  );
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 16,
    paddingBottom: 36,
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
  },
  center: {
    flex: 1,
    padding: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    color: colors.blue,
  },
  title: { fontSize: 32, fontWeight: "800", color: colors.ink },
  heading: { fontSize: 23, fontWeight: "700", color: colors.ink },
  body: { fontSize: 17, lineHeight: 26, color: colors.ink },
  muted: { fontSize: 14, lineHeight: 22, color: colors.muted },
  card: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  button: {
    minHeight: 52,
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  secondary: { backgroundColor: colors.pale },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    minHeight: 54,
    padding: 14,
    fontSize: 17,
    backgroundColor: colors.white,
    color: colors.ink,
  },
  error: { color: "#a12728", fontSize: 15, lineHeight: 23 },
  feedback: {
    color: colors.green,
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 25,
  },
});
