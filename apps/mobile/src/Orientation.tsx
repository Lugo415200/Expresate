import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLessonAudio } from "./useLessonAudio";
import { lessonType } from "./lessonTypography";
import { useReducedMotion } from "./useReducedMotion";
const { shuffled } = require("./lessonInteraction");
import { useAppSounds } from "./useAppSounds";
import { WelcomeWordmark, welcomeColors } from "./WelcomeArtwork";

const { purple: BLUE, purple: PURPLE, ivory: WHITE, navy: INK, yellow: YELLOW } = welcomeColors;

const STEPS = ["ESCUCHAR", "RESPONDER", "CONSEJO", "AVANZAR"] as const;

export function Orientation({
  onComplete,
  onCancel,
}: {
  onComplete: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const answerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerLocked = useRef(false);
  const moveLocked = useRef(false);
  const finishLocked = useRef(false);
  const [answerPending, setAnswerPending] = useState(false);
  const [roundHeard, setRoundHeard] = useState(false);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (answerTimer.current) clearTimeout(answerTimer.current);
    if (moveTimer.current) clearTimeout(moveTimer.current);
    if (finishTimer.current) clearTimeout(finishTimer.current);
  }, []);
  const insets = useSafeAreaInsets();
  const audio = useLessonAudio();
  const sfx = useAppSounds();
  const [step, setStep] = useState(0);
  const [heard, setHeard] = useState(false);
  const [answerRound, setAnswerRound] = useState<0 | 1>(0);
  const [firstChoice, setFirstChoice] = useState<"A" | "E" | null>(null);
  const [secondChoice, setSecondChoice] = useState<"A" | "E" | null>(null);
  const [consejoOpen, setConsejoOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const stepReady =
    step === 0
      ? heard
      : step === 1
        ? firstChoice === "A" && secondChoice === "E"
        : step === 2
          ? consejoOpen
          : true;
  const nextDisabled = !stepReady || moving || finishing || answerPending;

  async function playA() {
    if (audio.playing) return;
    const ok = await audio.play(["a"]);
    if (ok) setHeard(true);
  }

  async function playAnswerAudio() {
    if (audio.playing) return;
    if (await audio.play([answerRound === 0 ? "a" : "e"])) setRoundHeard(true);
  }

  function answer(letter: "A" | "E") {
    if (!roundHeard || audio.playing || answerLocked.current || moveLocked.current) return;
    const correct = letter === (answerRound === 0 ? "A" : "E");
    if (answerRound === 0) setFirstChoice(letter); else setSecondChoice(letter);
    sfx.play(correct ? "success" : "wrong");
    if (!correct) return;
    answerLocked.current = true;
    setAnswerPending(true);
    answerTimer.current = setTimeout(() => {
      answerLocked.current = false;
      setAnswerPending(false);
      setRoundHeard(false);
      if (answerRound === 0) setAnswerRound(1); else moveTo(2);
    }, 700);
  }

  function moveTo(next: number) {
    if (moveLocked.current || finishLocked.current || next < 0 || next >= STEPS.length) return;
    moveLocked.current = true;
    if (answerTimer.current) clearTimeout(answerTimer.current);
    answerLocked.current = false;
    setAnswerPending(false);
    audio.stop();
    setStep(next);
    if (reducedMotion) { moveLocked.current = false; return; }
    setMoving(true);
    sfx.play("tap");
    // Keep rapid taps guarded while the complete next screen appears at once.
    moveTimer.current = setTimeout(() => { moveLocked.current = false; setMoving(false); }, 350);
  }

  async function finish() {
    if (finishLocked.current) return;
    finishLocked.current = true;
    if (reducedMotion) { audio.stop(); await onComplete(); return; }
    setFinishing(true);
    sfx.play("transition");
    audio.stop();
    // Preserve the existing transition content and reading interval, without zoom/fades.
    finishTimer.current = setTimeout(() => { void onComplete(); }, 2900);
  }

  return (
    <View testID="orientation-screen" style={styles.root}>
      <StatusBar style="light" />

      <View
        style={[
          styles.header,
          { paddingTop: Math.max(insets.top + 8, 20), paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right },
        ]}
      >
        <WelcomeWordmark size={32} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Salir de orientación"
          onPress={() => {
            audio.stop();
            onCancel();
          }}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>

      <View testID="orientation-progress" style={styles.progressWrap}>
        {STEPS.map((label, index) => (
          <View key={label} style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                index < step && styles.progressDone,
                index === step && styles.progressActive,
              ]}
            >
              <Text style={[styles.progressDotText, index <= step && styles.progressDotTextOnSurface]}>{index < step ? "✓" : index + 1}</Text>
            </View>
            {index < STEPS.length - 1 ? (
              <View style={[styles.progressLine, index < step && styles.progressLineDone]} />
            ) : null}
          </View>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
      <View style={[styles.scene, { paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right }]}>
        {step === 0 ? (
          <ListenStep heard={heard} playing={audio.playing} error={audio.error} onPlay={playA} />
        ) : step === 1 ? (
          <AnswerStep
            round={answerRound}
            firstChoice={firstChoice}
            secondChoice={secondChoice}
            playing={audio.playing}
            disabled={!roundHeard || audio.playing || answerPending}
            onReplay={playAnswerAudio}
            onChoose={answer}
          />
        ) : step === 2 ? (
          <ConsejoStep open={consejoOpen} onOpen={() => (sfx.play("consejo"), setConsejoOpen(true))} />
        ) : (
          <AdvanceStep />
        )}
      </View>

      </ScrollView>
      {finishing ? <ScrollView testID="orientation-handoff" style={styles.finishOverlay}
        contentContainerStyle={[styles.finishContent, { paddingTop: Math.max(insets.top, 24), paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.finishPanel}>
        <Text style={styles.finishKicker}>TU PRIMERA LECCIÓN</Text>
        <Text style={styles.finishTitle}>El alfabeto</Text>
        <Text style={styles.finishCopy}>Sofía te espera.</Text>
        </View>
      </ScrollView> : null}

      <View
        style={[
          styles.bottom,
          { paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right, paddingBottom: Math.max(insets.bottom + 14, 24) },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Paso anterior"
          disabled={step === 0 || moving || finishing}
          onPress={() => moveTo(step - 1)}
          style={({ pressed }) => [
            styles.backButton,
            step === 0 && styles.backHidden,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step === 0 ? "Continuar →" : step === STEPS.length - 1 ? "Empezar la lección" : "Siguiente"}
          disabled={nextDisabled}
          onPress={step === STEPS.length - 1 ? finish : () => moveTo(step + 1)}
          style={({ pressed }) => [
            styles.nextButton,
            nextDisabled && styles.nextDisabled,
            pressed && !nextDisabled && styles.nextPressed,
          ]}
        >
          <Text style={[styles.nextText, nextDisabled && styles.nextTextDisabled]}>
            {step === 0 ? "Continuar" : step === STEPS.length - 1 ? (finishing ? "…" : "Empezar la lección") : "Siguiente"}
          </Text>
          <Text style={[styles.nextArrow, nextDisabled && styles.nextTextDisabled]}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ListenStep({
  heard,
  playing,
  error,
  onPlay,
}: {
  heard: boolean;
  playing: boolean;
  error: string;
  onPlay: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const [activated, setActivated] = useState(false);
  const haloOpacity = useRef(new Animated.Value(0.32)).current;
  const highlighted = !activated && !heard;
  useEffect(() => {
    if (!highlighted || reducedMotion) { haloOpacity.setValue(0.32); return; }
    const halo = Animated.loop(Animated.sequence([
      Animated.timing(haloOpacity, { toValue: 0.48, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(haloOpacity, { toValue: 0.18, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    halo.start();
    return () => halo.stop();
  }, [highlighted, reducedMotion, haloOpacity]);
  return (
    <View style={styles.stepWrap}>
      <View style={styles.copyBlock}>
        <Text style={styles.eyebrow}>ESCUCHAR</Text>
        <Text style={styles.title}>Primero, escucha.</Text>
        <Text style={styles.copy}>Escucha el nombre de A en inglés.</Text>
      </View>
      <View style={styles.heroTileWrap}>
        {highlighted ? <Animated.View testID="orientation-listen-halo" pointerEvents="none" accessible={false}
          style={[styles.listenHalo, { opacity: haloOpacity }]} /> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escuchar la letra A"
          accessibilityHint={heard ? "Vuelve a escuchar el nombre de la letra A." : "Escucha el audio completo para continuar."}
          onPress={() => { setActivated(true); onPlay(); }}
          disabled={playing}
          style={({ pressed }) => [styles.heroTile, playing && styles.nextDisabled, pressed && styles.nextPressed]}
        >
          <WaveIcon />
          <Text style={styles.heroLetter}>A</Text>
          <Text accessibilityLiveRegion="polite" style={styles.listenPrompt}>
            {playing ? "Escuchando…" : heard ? "Escuchar otra vez" : "Toca para escuchar"}
          </Text>
        </Pressable>
      </View>
      {error ? <Text accessibilityLiveRegion="polite" style={styles.actionHint}>{error}</Text> : null}
    </View>
  );
}

function AnswerStep({
  round,
  firstChoice,
  secondChoice,
  playing,
  onReplay,
  onChoose,
  disabled,
}: {
  round: 0 | 1;
  firstChoice: "A" | "E" | null;
  secondChoice: "A" | "E" | null;
  playing: boolean;
  onReplay: () => void;
  onChoose: (letter: "A" | "E") => void;
  disabled: boolean;
}) {
  const choices: ("A" | "E")[] = React.useMemo(() => shuffled(["A", "E"]), [round]);
  const choice = round === 0 ? firstChoice : secondChoice;
  const target = round === 0 ? "A" : "E";
  const correct = choice === target;

  return (
    <View style={styles.stepWrap}>
      <View style={styles.copyBlock}>
        <Text style={styles.eyebrow}>RESPONDER · {round + 1} DE 2</Text>
        <Text style={styles.title}>¿Qué letra escuchaste?</Text>
        <Text style={styles.copy}>
          {round === 0
            ? "Escucha y elige la letra."
            : "Escucha la siguiente letra."}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Escuchar letra de práctica" onPress={onReplay} disabled={playing} style={({ pressed }) => [styles.replayButton, playing && styles.nextDisabled, pressed && styles.nextPressed]}>
        <WaveIcon compact />
        <Text style={styles.replayText}>{playing ? "Escuchando…" : "Escuchar otra vez"}</Text>
      </Pressable>
      <View style={styles.choiceRow}>
        {choices.map((letter) => {
          const selected = choice === letter;
          const good = selected && letter === target;
          const bad = selected && letter !== target;
          return (
            <Pressable
              key={letter}
              accessibilityRole="button"
              accessibilityLabel={`Elegir ${letter}`}
              disabled={disabled}
              onPress={() => onChoose(letter)}
              style={({ pressed }) => [
                styles.choiceTile,
                good && styles.choiceGood,
                bad && styles.choiceBad,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.choiceText, (good || bad) && styles.choiceTextSelected]}>{letter}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.feedback, correct && styles.successText]}>
        {choice === null
          ? "Elige una opción"
          : correct
            ? round === 0
              ? "✓ Correcto. Ahora escucha una más."
              : "✓ Correcto. Reconociste las dos."
            : `Casi. Escucha otra vez y prueba ${target}.`}
      </Text>
      <View style={styles.answerProgress}>
        <View style={[styles.answerProgressDot, firstChoice === "A" && styles.answerProgressDone]} />
        <View style={[styles.answerProgressDot, secondChoice === "E" && styles.answerProgressDone]} />
      </View>
    </View>
  );
}

function ConsejoStep({ open, onOpen }: { open: boolean; onOpen: () => void }) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.copyBlock}>
        <Text style={styles.eyebrow}>CONSEJO</Text>
        <Text style={styles.title}>Nunca tienes que adivinar.</Text>
        <Text style={styles.copy}>Abre Consejo cuando necesites ayuda.</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.consejoButton, pressed && styles.pressed]}>
        <Text style={styles.consejoBulb}>✦</Text>
        <Text style={styles.consejoButtonText}>{open ? "Consejo abierto" : "Abrir Consejo"}</Text>
      </Pressable>
      {open ? (
        <View style={styles.consejoCard}>
          <Text style={styles.consejoLabel}>CONSEJO</Text>
          <Text style={styles.consejoTitle}>Escucha antes de traducir.</Text>
          <Text style={styles.consejoCopy}>Primero escucha. Después conecta el significado.</Text>
        </View>
      ) : (
        <Text style={styles.actionHint}>Ábrelo una vez para ver cómo funciona.</Text>
      )}
    </View>
  );
}

function AdvanceStep() {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.copyBlock}>
        <Text style={styles.eyebrow}>AVANZAR</Text>
        <Text style={styles.title}>Eso es Exprésate.</Text>
        <Text style={styles.copy}>Escucha, responde y pide ayuda. ¡Ya puedes empezar!</Text>
      </View>
      <View style={styles.routeDemo} accessible={false}>
        <View style={[styles.routeNode, styles.routeNodeDone]}><Text style={styles.routeCheck}>✓</Text></View>
        <View style={styles.routeLine} />
        <View style={[styles.routeNode, styles.routeNodeDone]}><Text style={styles.routeCheck}>✓</Text></View>
        <View style={styles.routeLine} />
        <View style={[styles.routeNode, styles.routeNodeCurrent]}><Text style={styles.routeCurrentText}>A</Text></View>
      </View>
      <Text style={styles.readyLabel}>Listo para el alfabeto</Text>
    </View>
  );
}

function WaveIcon({ compact = false }: { compact?: boolean }) {
  const heights = compact ? [14, 22, 30, 20, 14] : [22, 34, 48, 36, 26];
  return (
    <View style={styles.waveIcon}>
      {heights.map((height, index) => (
        <View key={index} style={[styles.waveBar, compact && styles.waveBarCompact, { height }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BLUE },
  header: { minHeight: 84, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 5 },
  close: { minWidth: 48, minHeight: 48, padding: 6, borderRadius: 4, borderWidth: 1.5, borderColor: INK, backgroundColor: WHITE, alignItems: "center", justifyContent: "center", boxShadow: "2px 3px 0px #0B1332" },
  closeText: { color: INK, fontSize: 30, lineHeight: 34, fontWeight: "600" },
  pressed: { opacity: 0.8 },
  progressWrap: { minHeight: 48, paddingHorizontal: 24, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  progressItem: { flexDirection: "row", alignItems: "center" },
  progressDot: { minWidth: 32, minHeight: 32, padding: 4, borderRadius: 4, borderWidth: 1.5, borderColor: WHITE, alignItems: "center", justifyContent: "center" },
  progressActive: { backgroundColor: YELLOW, borderColor: INK },
  progressDone: { backgroundColor: WHITE, borderColor: INK },
  progressDotText: { ...lessonType.label, color: WHITE },
  progressDotTextOnSurface: { color: INK },
  progressLine: { width: 22, height: 2, backgroundColor: WHITE },
  progressLineDone: { backgroundColor: WHITE },
  scene: { flex: 1 },
  stepWrap: { flexGrow: 1, width: "100%", maxWidth: 460, alignSelf: "center", paddingTop: 16, alignItems: "center", justifyContent: "center", paddingBottom: 16 },
  copyBlock: { width: "100%", alignItems: "center", marginBottom: 24, padding: 20, borderRadius: 6, borderWidth: 1.5, borderColor: INK, backgroundColor: WHITE, boxShadow: "3px 4px 0px #0B1332" },
  eyebrow: { ...lessonType.label, color: PURPLE, marginBottom: 10, textAlign: "center" },
  title: { ...lessonType.question, color: INK, textAlign: "center", marginBottom: 10 },
  copy: { ...lessonType.instruction, color: INK, textAlign: "center" },
  heroTileWrap: { maxWidth: "100%", alignItems: "center", justifyContent: "center", margin: 8 },
  heroTile: { maxWidth: "100%", minWidth: 160, minHeight: 176, padding: 16, gap: 8, borderRadius: 6, backgroundColor: YELLOW, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: INK, boxShadow: "3px 5px 0px #0B1332" },
  listenHalo: { position: "absolute", top: -8, bottom: -8, left: -8, right: -8, borderRadius: 10, borderWidth: 3, borderColor: YELLOW, backgroundColor: YELLOW },
  heroLetter: { ...lessonType.hero, color: INK, textAlign: "center" },
  waveIcon: { flexDirection: "row", alignItems: "center", gap: 5 },
  waveBar: { width: 7, borderRadius: 1, backgroundColor: INK },
  waveBarCompact: { width: 5, backgroundColor: INK },
  listenPrompt: { ...lessonType.button, color: INK, textAlign: "center", alignSelf: "stretch" },
  actionHint: { ...lessonType.helper, color: WHITE, marginTop: 16, textAlign: "center" },
  successText: { color: YELLOW },
  replayButton: { alignSelf: "stretch", justifyContent: "center", flexWrap: "wrap", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, minHeight: 64, paddingVertical: 14, borderRadius: 4, backgroundColor: YELLOW, borderWidth: 1.5, borderColor: INK, marginBottom: 24, boxShadow: "2px 3px 0px #0B1332" },
  replayText: { ...lessonType.button, flexShrink: 1, textAlign: "center", color: INK },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 16 },
  choiceTile: { minWidth: 100, minHeight: 100, padding: 12, borderRadius: 6, backgroundColor: WHITE, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: INK, boxShadow: "3px 4px 0px #0B1332" },
  choiceGood: { borderColor: YELLOW, backgroundColor: WHITE },
  choiceBad: { borderColor: "#A52B3A", backgroundColor: WHITE },
  choiceText: { ...lessonType.answer, color: INK },
  choiceTextSelected: { color: INK },
  feedback: { ...lessonType.instruction, color: WHITE, marginTop: 20, textAlign: "center" },
  consejoButton: { minHeight: 64, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 4, borderWidth: 1.5, borderColor: INK, backgroundColor: WHITE, flexDirection: "row", alignItems: "center", gap: 10, boxShadow: "2px 3px 0px #0B1332" },
  consejoBulb: { color: PURPLE, fontSize: 22, fontWeight: "900" },
  consejoButtonText: { ...lessonType.button, flexShrink: 1, textAlign: "center", color: INK },
  consejoCard: { marginTop: 24, width: "100%", borderRadius: 6, borderWidth: 1.5, borderColor: INK, borderTopWidth: 5, borderTopColor: YELLOW, padding: 20, backgroundColor: WHITE, boxShadow: "3px 4px 0px #0B1332" },
  consejoLabel: { ...lessonType.label, color: PURPLE, marginBottom: 8 },
  consejoTitle: { ...lessonType.question, color: INK, marginBottom: 10 },
  consejoCopy: { ...lessonType.instruction, color: INK },
  routeDemo: { width: "100%", maxWidth: 320, flexDirection: "row", alignItems: "stretch", marginTop: 8 },
  routeNode: { flex: 1, minWidth: 0, minHeight: 72, padding: 6, borderRadius: 4, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: INK },
  routeNodeDone: { backgroundColor: WHITE },
  routeNodeCurrent: { backgroundColor: YELLOW },
  routeCheck: { color: INK, fontSize: 28, lineHeight: 36, fontWeight: "900" },
  routeCurrentText: { ...lessonType.target, color: INK },
  routeLine: { alignSelf: "center", width: 16, height: 2, backgroundColor: WHITE },
  readyLabel: { ...lessonType.helper, color: WHITE, marginTop: 24, textAlign: "center" },
  answerProgress: { flexDirection: "row", gap: 8, marginTop: 18 },
  answerProgressDot: { width: 10, height: 10, borderRadius: 1, borderWidth: 1, borderColor: WHITE },
  answerProgressDone: { backgroundColor: YELLOW, borderColor: YELLOW },
  finishOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, backgroundColor: PURPLE },
  finishContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  finishPanel: { width: "100%", maxWidth: 420, padding: 24, gap: 14, borderRadius: 6, backgroundColor: WHITE, borderWidth: 1.5, borderColor: INK, boxShadow: "3px 4px 0px #0B1332" },
  finishKicker: { ...lessonType.label, color: PURPLE, textAlign: "center" },
  finishTitle: { ...lessonType.target, color: INK, textAlign: "center" },
  finishCopy: { ...lessonType.instruction, color: INK, textAlign: "center" },
  bottom: { minHeight: 108, width: "100%", maxWidth: 520, alignSelf: "center", paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: BLUE },
  backButton: { minWidth: 48, minHeight: 64, padding: 8, borderRadius: 4, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: INK, backgroundColor: WHITE },
  backHidden: { opacity: 0 },
  backText: { color: INK, fontSize: 25, lineHeight: 32, fontWeight: "900" },
  nextButton: { flex: 1, minWidth: 0, minHeight: 64, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1.5, borderColor: INK, backgroundColor: YELLOW, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "2px 3px 0px #0B1332" },
  nextDisabled: { backgroundColor: "#DAD6EC", boxShadow: "none" },
  nextPressed: { opacity: 0.85, transform: [{ translateX: 1 }, { translateY: 2 }], boxShadow: "1px 1px 0px #0B1332" },
  nextText: { ...lessonType.button, flexShrink: 1, textAlign: "center", color: INK },
  nextArrow: { color: INK, fontSize: 22, lineHeight: 29, fontWeight: "900" },
  nextTextDisabled: { color: "#646171" },
});
