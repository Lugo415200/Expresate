import React, { useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { courseModules, CourseModule, CourseStep } from "./courseData";
import courseRelease from "../../../data/lessons";
import { colors } from "./ui";
import { characterArt, pixelImageStyle } from "./characterArt";

type Progress = {
  lessons?: Record<string, { done?: boolean }>;
  quizzes?: Record<string, { passed?: boolean }>;
};

function done(progress: Progress, id: string) {
  return id.startsWith("quiz-")
    ? progress.quizzes?.[id]?.passed === true
    : progress.lessons?.[id]?.done === true;
}

function StepRow({
  step,
  index,
  progress,
  moduleLocked,
  premium,
  onOpenLesson000,
}: {
  step: CourseStep;
  index: number;
  progress: Progress;
  moduleLocked: boolean;
  premium: boolean | null;
  onOpenLesson000: () => void;
}) {
  const complete = done(progress, step.id);
  const prerequisiteDone = !step.requires || done(progress, step.requires);
  const premiumLocked = step.premium === true && premium !== true;
  const progressionLocked = moduleLocked || !prerequisiteDone;
  const released = courseRelease.release.isAvailable(step);
  const nativeReady = released && step.native === true;
  const disabled = progressionLocked || premiumLocked || !nativeReady;

  let status = "Próximamente";
  if (!released) status = "Próximamente";
  else if (complete) status = "Completada";
  else if (progressionLocked) status = "Bloqueada";
  else if (premiumLocked) status = "Premium";
  else if (nativeReady) status = "Disponible";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={nativeReady ? onOpenLesson000 : undefined}
      style={({ pressed }) => [
        styles.step,
        complete && released && styles.stepDone,
        progressionLocked && styles.stepLocked,
        nativeReady && !progressionLocked && !premiumLocked && styles.stepReady,
        pressed && !disabled && styles.stepPressed,
      ]}
    >
      <View
        style={[
          styles.stepNum,
          complete && released && styles.stepNumDone,
          progressionLocked && styles.stepNumLocked,
        ]}
      >
        <Text
          style={[
            styles.stepNumText,
            complete && released && styles.stepNumDoneText,
          ]}
        >
          {complete && released ? "✓" : index + 1}
        </Text>
      </View>
      <View style={styles.stepCopy}>
        <View style={styles.stepTitleRow}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          {released && step.premium ? <Text style={styles.premiumPill}>PREMIUM</Text> : null}
        </View>
        <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        {!nativeReady && !progressionLocked && !premiumLocked ? (
          <Text style={styles.nativeNote}>Estamos preparando tu próxima lección.</Text>
        ) : null}
      </View>
      <Text
        style={[
          styles.status,
          complete && released && styles.statusDone,
          progressionLocked && styles.statusLocked,
        ]}
      >
        {status}
      </Text>
    </Pressable>
  );
}

function ModuleCard({
  module,
  progress,
  premium,
  onOpenLesson000,
  onReplayOrientation,
}: {
  module: CourseModule;
  progress: Progress;
  premium: boolean | null;
  onOpenLesson000: () => void;
  onReplayOrientation: () => void;
}) {
  const moduleLocked = !!module.lockOnQuiz && !done(progress, module.lockOnQuiz);
  const [open, setOpen] = useState(module.id === "module-0" || !moduleLocked);

  return (
    <View style={[styles.module, moduleLocked && styles.moduleLocked]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen((value) => !value)}
        style={styles.moduleHeader}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.moduleTitle}>{module.title}</Text>
          <Text style={styles.moduleHint}>{module.hint}</Text>
        </View>
        <View style={styles.moduleMeta}>
          {moduleLocked ? <Text style={styles.lockPill}>BLOQUEADO</Text> : null}
          <Text style={styles.chevron}>{open ? "⌃" : "⌄"}</Text>
        </View>
      </Pressable>
      {open ? (
        <View style={styles.steps}>
          {module.id === "module-0" && courseRelease.beta.secondaryLearning ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reproducir orientación"
              onPress={onReplayOrientation}
              style={({ pressed }) => [
                styles.orientationRow,
                pressed && styles.stepPressed,
              ]}
            >
              <View style={styles.orientationIcon}>
                <Text style={styles.orientationIconText}>→</Text>
              </View>
              <View style={styles.stepCopy}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>Orientación</Text>
                  <Text style={styles.devPill}>DESARROLLO</Text>
                </View>
                <Text style={styles.stepSubtitle}>Repite la introducción animada de la primera lección.</Text>
              </View>
              <Text style={styles.orientationAction}>REPETIR</Text>
            </Pressable>
          ) : null}
          {module.steps.map((step, index) => (
            <StepRow
              key={step.id}
              step={step}
              index={index}
              progress={progress}
              moduleLocked={moduleLocked}
              premium={premium}
              onOpenLesson000={onOpenLesson000}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function CourseMap({
  progress,
  premium,
  stats,
  onOpenLesson000,
  onReplayOrientation,
}: {
  progress: Progress;
  premium: boolean | null;
  stats: { xp: number; streak: number; completed: number };
  onOpenLesson000: () => void;
  onReplayOrientation: () => void;
}) {
  const totalSteps = useMemo(
    () => courseModules.reduce((sum, module) => sum + module.steps.filter(step => courseRelease.release.isAvailable(step)).length, 0),
    [],
  );
  const completedSteps = useMemo(
    () =>
      courseModules.reduce(
        (sum, module) =>
          sum + module.steps.filter((step) => courseRelease.release.isAvailable(step) && done(progress, step.id)).length,
        0,
      ),
    [progress],
  );
  const percent = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <View style={styles.wrap}>
      <ImageBackground
        source={require("../../../assets/design/sweetink-gradient-texture.jpg")}
        imageStyle={styles.heroImage}
        style={styles.hero}
      >
        <View style={styles.heroWash} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>TU RUTA DE INGLÉS</Text>
          <Text style={styles.heroTitle}>Aprende paso a paso.</Text>
          <Text style={styles.heroBody}>
            La misma ruta de Exprésate Web, adaptada para tu teléfono.
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {completedSteps} de {totalSteps} {totalSteps === 1 ? "paso" : "pasos"} · {percent}%
          </Text>
        </View>
        <Image
          source={characterArt.sofia}
          accessibilityLabel="Sofía"
          style={[styles.sofia, pixelImageStyle]}
          resizeMode="contain"
          resizeMethod="scale"
        />
      </ImageBackground>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.xp}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.streak}</Text>
          <Text style={styles.statLabel}>racha</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>lecciones</Text>
        </View>
      </View>

      <View style={styles.routeHead}>
        <View>
          <Text style={styles.routeTitle}>Tu recorrido</Text>
          <Text style={styles.routeSubtitle}>
            Nuevas lecciones se irán desbloqueando durante la beta.
          </Text>
        </View>
      </View>

      {courseModules.map(module => ({ ...module, steps: module.steps.filter(step => courseRelease.release.status(step) !== "locked") })).filter(module => module.steps.length > 0).map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          progress={progress}
          premium={premium}
          onOpenLesson000={onOpenLesson000}
          onReplayOrientation={onReplayOrientation}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  hero: {
    minHeight: 250,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "flex-end",
    borderWidth: 1,
    borderColor: "rgba(75,102,242,0.14)",
    backgroundColor: "#dfe7ff",
  },
  heroImage: { borderRadius: 28 },
  heroWash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(250,252,255,0.64)",
  },
  heroCopy: {
    padding: 22,
    paddingRight: 128,
    zIndex: 2,
  },
  heroEyebrow: {
    color: colors.blue,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontSize: 11,
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 29,
    lineHeight: 32,
    fontWeight: "900",
    marginTop: 7,
  },
  heroBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },
  sofia: {
    position: "absolute",
    right: -6,
    bottom: -5,
    width: 128,
    height: 192,
    zIndex: 1,
  },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 16,
    backgroundColor: "rgba(75,102,242,0.14)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.blue,
  },
  progressLabel: {
    marginTop: 7,
    color: colors.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    minHeight: 76,
    paddingVertical: 13,
    paddingHorizontal: 11,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.83)",
    borderWidth: 1,
    borderColor: "rgba(75,102,242,0.11)",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: { color: colors.ink, fontSize: 23, fontWeight: "900" },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  routeHead: { paddingTop: 4, paddingHorizontal: 2 },
  routeTitle: { color: colors.ink, fontSize: 24, fontWeight: "900" },
  routeSubtitle: { color: colors.muted, marginTop: 4, fontSize: 13, lineHeight: 19 },
  orientationRow: {
    minHeight: 82,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "rgba(109,93,252,0.07)",
    borderWidth: 1,
    borderColor: "rgba(109,93,252,0.18)",
  },
  orientationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  orientationIconText: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  orientationAction: { color: colors.blue, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  devPill: {
    color: colors.blue,
    backgroundColor: "rgba(75,102,242,0.10)",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  module: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(75,102,242,0.13)",
    shadowColor: colors.blue,
    shadowOpacity: 0.08,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 9 },
  },
  moduleLocked: { opacity: 0.78 },
  moduleHeader: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  moduleTitle: { color: colors.ink, fontSize: 18, lineHeight: 22, fontWeight: "900" },
  moduleHint: { color: colors.muted, fontSize: 12, marginTop: 4 },
  moduleMeta: { alignItems: "flex-end", gap: 5 },
  lockPill: {
    color: "#6f5b16",
    backgroundColor: "#fff4c7",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 9,
    fontWeight: "900",
    overflow: "hidden",
  },
  chevron: { color: colors.blue, fontSize: 20, fontWeight: "900" },
  steps: { marginTop: 12, gap: 10 },
  step: {
    minHeight: 78,
    borderRadius: 17,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 1,
    borderColor: "rgba(75,102,242,0.11)",
    shadowColor: colors.blue,
    shadowOpacity: 0.06,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
  },
  stepReady: { borderColor: "rgba(75,102,242,0.34)", borderWidth: 1.5 },
  stepDone: { borderColor: "rgba(35,118,77,0.28)", backgroundColor: "#f5fff9" },
  stepLocked: { opacity: 0.57 },
  stepPressed: { transform: [{ translateY: 1 }] },
  stepNum: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(75,102,242,0.11)",
  },
  stepNumLocked: { backgroundColor: "rgba(71,85,105,0.12)" },
  stepNumDone: { backgroundColor: colors.green },
  stepNumText: { color: colors.blue, fontWeight: "900", fontSize: 13 },
  stepNumDoneText: { color: colors.white },
  stepCopy: { flex: 1, minWidth: 0 },
  stepTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, flexWrap: "wrap" },
  stepTitle: { color: colors.ink, fontSize: 14, lineHeight: 18, fontWeight: "800", flexShrink: 1 },
  stepSubtitle: { color: colors.muted, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  nativeNote: { color: colors.blue, fontSize: 10.5, fontWeight: "800", marginTop: 5 },
  premiumPill: {
    color: "#6647c7",
    backgroundColor: "#eee7ff",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    fontSize: 8,
    fontWeight: "900",
    overflow: "hidden",
  },
  status: { color: colors.blue, fontSize: 10, fontWeight: "900", maxWidth: 70, textAlign: "right" },
  statusDone: { color: colors.green },
  statusLocked: { color: colors.muted },
});
