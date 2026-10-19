import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "./ui";

const SofiaConceptPreview = __DEV__ ? require("./dev/SofiaConceptPreview").SofiaConceptPreview : null;

type Props = {
  completed: boolean;
  orientationSeen: boolean | null;
  onOpenLesson: () => void;
  onReplayOrientation: () => void;
  onOpenAccount: () => void;
  onOpenMap?: () => void;
};

export function BetaHome({
  completed,
  orientationSeen,
  onOpenLesson,
  onReplayOrientation,
  onOpenAccount,
  onOpenMap,
}: Props) {
  const [conceptOpen, setConceptOpen] = useState(false);
  const lessonLabel = completed
    ? "Repasar El alfabeto"
    : orientationSeen
      ? "Continuar la lección"
      : "Empezar la lección";

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.brand}>EXPRÉSATE</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir mi cuenta"
          onPress={onOpenAccount}
          hitSlop={12}
          style={({ pressed }) => [
            styles.accountLink,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.accountText}>Mi cuenta</Text>
        </Pressable>
      </View>

      <View style={styles.heroCopy}>
        <Text style={styles.title}>Tu inglés empieza aquí.</Text>
        <Text style={styles.subtitle}>
          Aprende inglés desde cero, paso a paso y en español.
        </Text>
      </View>

      <View style={styles.lessonCard}>
        <Text style={styles.lessonEyebrow}>PRIMERA LECCIÓN</Text>
        <Text style={styles.lessonTitle}>El alfabeto</Text>
        <Text style={styles.lessonBody}>
          Aprende las letras del inglés y cómo usarlas para deletrear.
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>~ 10–15 min</Text>
          </View>
          {completed ? (
            <View style={styles.completePill}>
              <Text style={styles.completeText}>✓ COMPLETADA</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onOpenLesson}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryPressed,
          ]}
        >
          <Text style={styles.primaryText}>{lessonLabel}</Text>
          <Text style={styles.primaryArrow}>→</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reproducir orientación de desarrollo"
          onPress={onReplayOrientation}
          style={({ pressed }) => [
            styles.replayButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.replayText}>
            ↻ Reproducir orientación · desarrollo
          </Text>
        </Pressable>
      </View>

      {__DEV__ && SofiaConceptPreview ? <>
        <Pressable accessibilityRole="button" accessibilityLabel="Ver concepto pixel art de Sofía"
          onPress={() => setConceptOpen(true)}
          style={({ pressed }) => [styles.replayButton, pressed && styles.pressed]}>
          <Text style={styles.replayText}>Sofía pixel art · vista previa de desarrollo</Text>
        </Pressable>
        {conceptOpen ? <SofiaConceptPreview onClose={() => setConceptOpen(false)} /> : null}
      </> : null}

      <View style={styles.nextRow}>
        <View style={styles.nextDot} />
        <View style={styles.nextCopy}>
          <Text style={styles.nextLabel}>SIGUIENTE</Text>
          <Text style={styles.nextTitle}>Sonidos clave</Text>
        </View>
        <Text style={styles.comingSoon}>PRÓXIMAMENTE</Text>
      </View>

      {completed && onOpenMap ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenMap}
          style={({ pressed }) => [styles.mapLink, pressed && styles.pressed]}
        >
          <Text style={styles.mapLinkText}>Ver tu recorrido completo →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    maxWidth: 620,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 42,
    gap: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 3.2,
  },
  accountLink: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  accountText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  heroCopy: {
    gap: 8,
    paddingTop: 10,
    paddingBottom: 6,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 27,
    maxWidth: 470,
  },
  lessonCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 13,
  },
  lessonEyebrow: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
  },
  lessonTitle: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
  },
  lessonBody: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  timePill: {
    alignSelf: "flex-start",
    backgroundColor: "#f2f4fa",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  timeText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  completePill: {
    alignSelf: "flex-start",
    backgroundColor: "#eaf7ef",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },
  completeText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: colors.blue,
    paddingHorizontal: 18,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  primaryText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "800",
  },
  primaryArrow: {
    color: colors.white,
    fontSize: 23,
    fontWeight: "700",
    marginTop: -2,
  },
  replayButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -1,
  },
  replayText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: "700",
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
    opacity: 0.72,
  },
  nextDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.blue,
  },
  nextCopy: {
    flex: 1,
    gap: 2,
  },
  nextLabel: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  nextTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  comingSoon: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  mapLink: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  mapLinkText: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.58,
  },
});
