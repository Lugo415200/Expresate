import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  BackHandler,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { lesson000 } from "../../../shared/lesson000-flow";
import { lessonType, lessonSpace } from "./lessonTypography";
import { lessonColors as palette, lessonSurfaces as surfaces } from "./lessonTheme";
import { useLessonAudio } from "./useLessonAudio";
import { useAppSounds } from "./useAppSounds";
import { StoryScene } from "./StoryScene";
import { characterArt, pixelImageStyle } from "./characterArt";

function Button({ title, onPress, disabled = false, secondary = false }: {
  title: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.primaryButton, surfaces.control, !secondary && surfaces.primary, disabled && surfaces.disabled, pressed && !disabled && surfaces.pressed]}>
    <Text style={[styles.buttonText, disabled && surfaces.disabledInk]}>{title}</Text>
  </Pressable>;
}

function AudioAction({ label, playing, disabled = playing, onPress, title, large = false }: {
  label: string; playing: boolean; disabled?: boolean; onPress: () => void; title: string; large?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, busy: playing }}
    accessibilityHint={playing ? "Espera a que termine la grabación." : disabled ? "La actividad ya está completada." : "Toca para escuchar la grabación."}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [large ? styles.bigAudio : styles.compactAudio, surfaces.control, surfaces.primary, disabled && surfaces.disabled, pressed && !disabled && surfaces.pressed]}>
    <Text accessible={false} style={[styles.bigAudioIcon, disabled && surfaces.disabledInk]}>♪</Text>
    <Text style={[styles.bigAudioLabel, disabled && surfaces.disabledInk]}>{title}</Text>
  </Pressable>;
}

type AnswerState = "default" | "selected" | "correct" | "incorrect";
function AnswerTile({ value, state = "default", disabled, onPress, keyboard = false }: {
  value: string; state?: AnswerState; disabled: boolean; onPress: () => void; keyboard?: boolean;
}) {
  const cue = state === "correct" ? "✓" : state === "incorrect" ? "×" : state === "selected" ? "●" : disabled ? "—" : keyboard ? "+" : "Elegir";
  const hint = state === "correct" ? "Respuesta correcta." : state === "incorrect" ? "Respuesta incorrecta. Puedes probar otra vez." : state === "selected" ? "Letra seleccionada." : disabled ? "Opción no disponible en este momento." : "Toca para elegir esta letra.";
  return <Pressable accessibilityRole="button" accessibilityLabel={`Elegir ${value}`} accessibilityHint={hint}
    accessibilityState={{ disabled, selected: state !== "default" }} aria-selected={state !== "default"} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.answerTile, keyboard && styles.keyboardKey, surfaces.control, state === "selected" && surfaces.primary,
      disabled && state === "default" && surfaces.disabled, state === "correct" && surfaces.correct,
      state === "incorrect" && surfaces.incorrect, pressed && !disabled && surfaces.pressed]}>
    <Text style={[styles.answerText, disabled && state === "default" && surfaces.disabledInk]}>{value}</Text>
    <Text accessible={false} style={[styles.answerCue, disabled && state === "default" && surfaces.disabledInk]}>{cue}</Text>
  </Pressable>;
}

const content = require("../../../shared/lesson000");
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
const VISUALS = [
  { letter: "A", word: "Apple", spanish: "Manzana", image: require("../assets/lesson000/apple-framed.png") },
  { letter: "A", word: "Airplane", spanish: "Avión", image: require("../assets/lesson000/airplane-framed.png") },
  { letter: "D", word: "Dog", spanish: "Perro", image: require("../assets/lesson000/dog-framed.png") },
];

type Quiz = { audio: string; choices: string[]; answer: string };
const HEARING_QUIZ: Quiz[] = [
  { audio: "g", choices: ["B", "G", "J"], answer: "G" },
  { audio: "m", choices: ["N", "M", "W"], answer: "M" },
  { audio: "s", choices: ["F", "S", "X"], answer: "S" },
];

const { shuffled } = require("./lessonInteraction");

const SPELL_WORDS = [
  { word: "CAT", spanish: "gato", letters: ["c", "a", "t"], choices: ["c", "a", "t", "b"] },
  { word: "MAP", spanish: "mapa", letters: ["m", "a", "p"], choices: ["m", "a", "p", "n"] },
];

type Step =
  | "map"
  | "alphabet"
  | "letter-name"
  | "examples"
  | "recognize"
  | "explore"
  | "hearing"
  | "spell"
  | "sofia"
  | "completion";

const STEPS: Step[] = [
  "map",
  "alphabet",
  "letter-name",
  "examples",
  "recognize",
  "explore",
  "hearing",
  "spell",
  "sofia",
  "completion",
];

export function Lesson({
  close,
  complete,
  signedIn,
  completed,
  pending,
  syncError,
  login,
}: {
  close: () => void;
  complete: () => Promise<void>;
  signedIn: boolean;
  completed: boolean;
  pending: boolean;
  syncError: string;
  login: () => void;
}) {
  const lastAction = useRef(0);
  const savingRef = useRef(false);
  function acceptTap() {
    const now = Date.now();
    if (now - lastAction.current < 350) return false;
    lastAction.current = now;
    return true;
  }
  const [activityFeedback, setActivityFeedback] = useState("");
  useEffect(() => { if (activityFeedback) AccessibilityInfo.announceForAccessibility(activityFeedback); }, [activityFeedback]);
  const [sofiaHeard, setSofiaHeard] = useState(false);
  const [storyLine, setStoryLine] = useState(0);
  const [storyDone, setStoryDone] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitioning = useRef(false);
  const spelling = useRef<string[]>([]);
  const [spellHeard, setSpellHeard] = useState(false);
  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);
  function afterCorrect(next: () => void) {
    AccessibilityInfo.announceForAccessibility("Correcto.");
    transitioning.current = true;
    transitionTimer.current = setTimeout(() => {
      next();
      setActivityFeedback("");
      lastAction.current = Date.now();
      transitioning.current = false;
      transitionTimer.current = null;
    }, 700);
  }
  const [recognizeAnswer, setRecognizeAnswer] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("a");
  const [visitedLetters, setVisitedLetters] = useState<string[]>([]);
  const [quizRound, setQuizRound] = useState(0);
  const [quizHeard, setQuizHeard] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [spellRound, setSpellRound] = useState(0);
  const [spellAnswer, setSpellAnswer] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState("");
  const audio = useLessonAudio();
  const sounds = useAppSounds();
  const welcome = lesson000.blocks[0];
  // Native dialogue beats; the shared website content is untouched.
  const storyLines = useMemo(() => welcome.type === "dialogue" ? welcome.lines.flatMap(line =>
    line.speaker.toLowerCase().includes("prof") ? [
      { ...line, text: "Bienvenidos a clase." },
      { ...line, text: "Hoy aprenderemos el alfabeto para compartir información con claridad." },
    ] : [line]) : [], [welcome]);
  const step = STEPS[stepIndex];
  const hearingChoices = useMemo(() => shuffled(HEARING_QUIZ[quizRound]?.choices ?? []), [quizRound]);

  const leave = () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    audio.stop();
    close();
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      leave();
      return true;
    });
    return () => sub.remove();
  }, []);

  function advance() {
    if (transitioning.current || !canContinue || !acceptTap()) return;
    setActivityFeedback("");
    audio.stop();
    sounds.play("tap");
    if (step === "examples" && exampleIndex < VISUALS.length - 1) {
      setExampleIndex(value => value + 1);
    } else setStepIndex((value) => Math.min(value + 1, STEPS.length - 1));
  }

  async function saveProgress() {
    if (savingRef.current || (completed && !pending) || (submitted && !pending)) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      await complete();
      setSubmitted(true);
      sounds.play("success");
    } catch (error: any) { setSaveError(error.message); }
    finally { savingRef.current = false; setSaving(false); }
  }

  async function playLetter(letter: string) {
    const ok = await audio.play([letter.toLowerCase()]);
    if (ok) {
      setVisitedLetters((value) => [...new Set([...value, letter.toLowerCase()])]);
    }
    return ok;
  }

  const canContinue = useMemo(() => {
    if (step === "sofia") return sofiaHeard;
    if (step === "recognize") return recognizeAnswer === "A";
    if (step === "explore") return visitedLetters.length >= 6;
    if (step === "hearing") return quizRound >= HEARING_QUIZ.length;
    if (step === "spell") return spellRound >= SPELL_WORDS.length;
    return true;
  }, [step, sofiaHeard, recognizeAnswer, visitedLetters, quizRound, spellRound]);

  if (!storyDone && welcome.type === "dialogue") {
    return (
      <View style={{ flex: 1, backgroundColor: palette.purple }}>
        <StatusBar hidden />
        <StoryScene
          sceneId={welcome.id}
          line={storyLines[storyLine]}
          lineIndex={storyLine}
          lineCount={storyLines.length}
          onNext={() => setStoryLine((value) => Math.min(value + 1, storyLines.length - 1))}
          onContinue={() => {
            sounds.play("transition");
            setStoryDone(true);
          }}
          onExit={leave}
        />
      </View>
    );
  }

  return (
    <SafeAreaView testID="lesson000-exercises" style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.topbar}>
        <Pressable accessibilityRole="button" onPress={leave} style={({ pressed }) => [styles.close, surfaces.control, pressed && surfaces.pressed]} accessibilityLabel="Salir de la lección">
          <Text style={styles.closeText}>‹</Text>
        </Pressable>
        <View accessibilityRole="progressbar" accessibilityLabel="Progreso de la lección" accessibilityValue={{ min: 0, max: STEPS.length, now: stepIndex + 1 }} style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${((stepIndex + 1) / STEPS.length) * 100}%` as `${number}%` },
            ]}
          />
        </View>
        <Text style={styles.counter}>{stepIndex + 1}/{STEPS.length}</Text>
      </View>

      <ScrollView
        key={`${step}-${exampleIndex}`}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator
      >
        {step === "map" && <LessonMap />}
        {step === "alphabet" && <AlphabetIdea />}
        {step === "letter-name" && <LetterName playing={audio.playing} onListen={() => playLetter("a")} />}
        {step === "examples" && <VisualExamples index={exampleIndex} playing={audio.playing} onListen={playLetter} />}
        {step === "recognize" && (
          <Recognition answer={recognizeAnswer} onChoose={(value) => {
            if (transitioning.current) return;
            if (value !== "A") AccessibilityInfo.announceForAccessibility("Todavía no. Busca la mayúscula de «a».");
            setRecognizeAnswer(value);
            sounds.play(value === "A" ? "success" : "wrong");
            if (value === "A") afterCorrect(() => setStepIndex(STEPS.indexOf("explore")));
          }} />
        )}
        {step === "explore" && (
          <AlphabetExplorer
            selected={selectedLetter}
            visited={visitedLetters}
            playing={audio.playing}
            onSelect={async (letter) => {
              setSelectedLetter(letter);
              await playLetter(letter);
            }}
          />
        )}
        {step === "hearing" && (
          <HearingRounds round={quizRound} choices={hearingChoices} heard={quizHeard}
            passed={quizPassed} playing={audio.playing} feedback={activityFeedback}
            onListen={async () => {
              if (transitioning.current) return;
              const q = HEARING_QUIZ[quizRound];
              if (q && await audio.play([q.audio])) setQuizHeard(true);
            }}
            onChoose={(choice) => {
              const q = HEARING_QUIZ[quizRound];
              if (!q || !quizHeard || audio.playing || transitioning.current) return;
              if (choice !== q.answer) {
                setActivityFeedback("Todavía no. Escucha otra vez.");
                sounds.play("wrong");
                return;
              }
              setActivityFeedback("");
              setQuizPassed(true);
              sounds.play("success");
              afterCorrect(() => {
                if (quizRound === HEARING_QUIZ.length - 1) setStepIndex(STEPS.indexOf("spell"));
                else setQuizRound(quizRound + 1);
                setQuizHeard(false);
                setQuizPassed(false);
              });
            }} />
        )}
        {step === "spell" && (
          <SpellingRounds round={spellRound} answer={spellAnswer} heard={spellHeard}
            playing={audio.playing} feedback={activityFeedback}
            onListen={async () => {
              if (transitioning.current) return;
              if (await audio.play(SPELL_WORDS[spellRound].letters)) setSpellHeard(true);
            }}
            onChoose={(letter) => {
              if (!spellHeard || audio.playing || transitioning.current) return;
              const word = SPELL_WORDS[spellRound];
              if (letter !== word.letters[spelling.current.length]) {
                setActivityFeedback("Prueba otra letra. Puedes volver a escuchar.");
                sounds.play("wrong");
                return;
              }
              setActivityFeedback("");
              // Update synchronously so a second tap cannot append using a stale render.
              spelling.current = [...spelling.current, letter];
              setSpellAnswer(spelling.current);
              const done = spelling.current.length === word.letters.length;
              sounds.play(done ? "success" : "tap");
              if (done) afterCorrect(() => {
                if (spellRound === SPELL_WORDS.length - 1) setStepIndex(STEPS.indexOf("sofia"));
                else setSpellRound(spellRound + 1);
                spelling.current = [];
                setSpellAnswer([]);
                setSpellHeard(false);
              });
            }} />
        )}
        {step === "sofia" && <SofiaChallenge playing={audio.playing} onListen={async () => { if (await audio.play(["s", "o", "f", "i", "a"])) setSofiaHeard(true); }} />}
        {step === "completion" && (
          <Completion saveError={saveError || (submitted ? syncError : "")} />
        )}

        {audio.error ? <View style={[styles.notice, surfaces.incorrect]}><Text accessibilityLiveRegion="polite" style={styles.feedback}>{audio.error}</Text></View> : null}
      </ScrollView>
      {step === "completion" ? (
        <View style={styles.footer}>
          {signedIn ? <Button title={saving ? "Guardando…" : (submitted || completed) && !pending ? "Guardado ✓" : "Guardar progreso"} disabled={saving || ((submitted || completed) && !pending)} onPress={saveProgress} /> : <Button title="Iniciar sesión para guardar" onPress={login} />}
          <Button secondary title="Volver al curso" onPress={leave} disabled={saving} />
        </View>
      ) : step === "recognize" ? (
        <Feedback wrong={!!recognizeAnswer && recognizeAnswer !== "A"} message={recognizeAnswer === "A" ? "✓ A y a son la misma letra. ¡Bien!" : recognizeAnswer ? "Todavía no. Busca la mayúscula de «a»." : "Elige una letra."} />
      ) : step === "hearing" ? (
        <Feedback wrong={!!activityFeedback} message={quizPassed ? `✓ Correcto. Esa es ${HEARING_QUIZ[quizRound].answer}.` : activityFeedback || (quizHeard ? "Elige una letra." : "Escucha para empezar.")} />
      ) : step === "spell" ? (
        <Feedback wrong={!!activityFeedback} message={spellAnswer.length === SPELL_WORDS[spellRound].letters.length ? `✓ ${SPELL_WORDS[spellRound].word}. Lo construiste letra por letra.` : activityFeedback || (spellHeard ? `${spellAnswer.length}/${SPELL_WORDS[spellRound].letters.length} letras` : "Escucha primero.")} />
      ) : (
        <View style={styles.footer}>
          <Button title={step === "sofia" ? "Terminar lección →" : "Siguiente →"} onPress={advance} disabled={!canContinue || audio.playing} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Feedback({ message, wrong }: { message: string; wrong: boolean }) {
  const { height } = useWindowDimensions();
  // Large-text feedback must remain readable without taking over the answer area.
  return <View style={styles.footer}><View testID="lesson-answer-feedback" style={[styles.notice, { maxHeight: Math.max(120, Math.min(240, height * 0.3)) }, wrong && surfaces.incorrect, message.startsWith("✓") && styles.noticeCorrect]}>
    <ScrollView bounces={false} style={styles.feedbackScroll}>
      <Text accessibilityLiveRegion="polite" style={styles.feedback}>{wrong ? <Text accessible={false} style={styles.feedbackIcon}>× </Text> : null}<Text>{message}</Text></Text>
    </ScrollView>
  </View></View>;
}

function Header({ kicker, title, body }: { kicker: string; title: string; body?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {body ? <Text style={styles.subtitle}>{body}</Text> : null}
    </View>
  );
}

function LessonMap() {
  const items = [
    ["01", "Escuchar", "Nombres de letras"],
    ["02", "Reconocer", "Con tus ojos y oídos"],
    ["03", "Deletrear", "Palabras y nombres"],
  ];
  return (
    <View style={styles.stage}>
      <Header kicker="LECCIÓN 000" title="Tu primer alfabeto" body="Escucha, reconoce y deletrea." />
      <View style={styles.darkCard}>
        {items.map(([n, name, copy]) => (
          <View key={n} style={styles.mapRow}>
            <View style={styles.mapNumber}><Text style={styles.mapNumberText}>{n}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.mapTitle}>{name}</Text><Text style={styles.mapCopy}>{copy}</Text></View>
          </View>
        ))}
      </View>
      <Text style={styles.note}>No necesitas memorizar todo hoy.</Text>
    </View>
  );
}

function AlphabetIdea() {
  return (
    <View style={styles.stage}>
      <Header kicker="EL ALFABETO" title="26 letras" body="Cada letra tiene una mayúscula y una minúscula." />
      <View style={styles.heroLetterCard}>
        <Text style={styles.heroLetters}>A a</Text>
        <Text style={styles.heroCaption}>mayúscula · minúscula</Text>
      </View>
    </View>
  );
}

function LetterName({ onListen, playing }: { onListen: () => void; playing: boolean }) {
  return <View style={styles.stage}>
    <Header kicker="EL NOMBRE DE LA LETRA" title="¿Cómo se llama A?" body="Toca para escuchar su nombre en inglés." />
    <View style={styles.heroLetterCard}><Text style={styles.heroLetters}>A</Text><Text style={styles.heroCaption}>Su nombre suena como «éi».</Text></View>
    <AudioAction label="Escuchar el nombre de A" playing={playing} onPress={onListen} title={playing ? "Escuchando…" : "Escuchar A"} />
    <Text style={styles.note}>Su nombre y su sonido en una palabra pueden ser diferentes.</Text>
  </View>;
}

function VisualExamples({ index, onListen, playing }: { index: number; onListen: (letter: string) => void; playing: boolean }) {
  const item = VISUALS[index];
  return <View style={styles.stage}>
    <Header kicker={`EN PALABRAS · ${index + 1}/${VISUALS.length}`} title={`${item.word} empieza con ${item.letter}`} body="Escucha el nombre de la primera letra." />
    <View style={styles.visualCard}>
      <Image accessibilityLabel={item.spanish} source={item.image} style={styles.visualImage} resizeMode="contain" />
      <Text style={styles.visualWord}>{item.word}</Text>
      <Text style={styles.visualSpanish}>{item.spanish}</Text>
    </View>
    <AudioAction label={`Escuchar la letra ${item.letter} de ${item.word}`} playing={playing} onPress={() => onListen(item.letter)} title={playing ? "Escuchando…" : `Escuchar ${item.letter}`} />
  </View>;
}

function Recognition({ answer, onChoose }: { answer: string; onChoose: (value: string) => void }) {
  const choices: string[] = useMemo(() => shuffled(["R", "A", "K"]), []);
  return (
    <View style={styles.stage}>
      <Header kicker="RECONOCE LA FORMA" title="¿Cuál es la mayúscula?" body="Encuentra la pareja de «a»." />
      <View style={styles.heroLetterCard}><Text style={styles.heroLetters}>a</Text></View>
      <View style={styles.answerRow}>{choices.map((value) => <AnswerTile key={value} value={value} disabled={answer === "A"} onPress={() => onChoose(value)} state={answer === value ? (value === "A" ? "correct" : "incorrect") : "default"} />)}</View>
    </View>
  );
}

function AlphabetExplorer({ selected, visited, playing, onSelect }: { selected: string; visited: string[]; playing: boolean; onSelect: (letter: string) => void }) {
  const info = content.letters[selected];
  return (
    <View style={styles.stage}>
      <Header kicker="TU ALFABETO" title="Explora las 26 letras." body="Toca y escucha al menos seis letras." />
      <View style={styles.selectedPanel}><Text style={styles.selectedBig}>{selected.toUpperCase()} {selected}</Text><Text style={styles.selectedExample}>{info.word} · {info.spanish}</Text><Text style={styles.visitedBadgeText}>{visited.length}/6 escuchadas</Text></View>
      <View testID="alphabet-explorer-grid" style={styles.alphabetGrid}>{ALPHABET.map((letter) => <Pressable accessibilityRole="button" disabled={playing} key={letter} accessibilityLabel={`Escuchar ${letter.toUpperCase()}${visited.includes(letter) ? ", escuchada" : ""}`} accessibilityHint={selected === letter ? "Letra seleccionada." : visited.includes(letter) ? "Ya escuchada. Toca para repetir." : "Toca para escuchar esta letra."} accessibilityState={{ selected: selected === letter, disabled: playing }} aria-selected={selected === letter} onPress={() => onSelect(letter)}
        style={({ pressed }) => [styles.alphaTile, surfaces.control, selected === letter && surfaces.primary, playing && surfaces.disabled, pressed && !playing && surfaces.pressed]}>
        <Text style={[styles.alphaText, playing && surfaces.disabledInk]}>{letter.toUpperCase()}</Text>
        <Text accessible={false} style={[styles.answerCue, playing && surfaces.disabledInk]}>{selected === letter ? "●" : visited.includes(letter) ? "Oída" : "♪"}</Text>
      </Pressable>)}</View>

    </View>
  );
}

function HearingRounds({ round, choices, heard, passed, playing, feedback, onListen, onChoose }: { round: number; choices: string[]; heard: boolean; passed: boolean; playing: boolean; feedback: string; onListen: () => void; onChoose: (choice: string) => void }) {
  const q = HEARING_QUIZ[round];
  const [lastChoice, setLastChoice] = useState("");
  useEffect(() => { setLastChoice(""); }, [round, playing]);
  return (
    <View style={styles.stage}>
      <Header kicker={`RETO DE OÍDO · ${round + 1}/${HEARING_QUIZ.length}`} title="¿Qué letra escuchas?" />
      <AudioAction large label={playing ? "Reproduciendo letra" : "Escuchar letra del reto"} playing={playing} disabled={playing || passed} onPress={onListen} title={playing ? "Escuchando…" : heard ? "Escuchar otra vez" : "Toca para escuchar"} />
      <View style={styles.answerRow}>{choices.map((choice) => <AnswerTile key={choice} value={choice} disabled={!heard || passed || playing}
        onPress={() => { setLastChoice(choice); onChoose(choice); }}
        state={passed && choice === q.answer ? "correct" : choice === lastChoice ? (feedback ? "incorrect" : "selected") : "default"} />)}</View>
    </View>
  );
}

function SpellingRounds({ round, answer, heard, playing, feedback, onListen, onChoose }: { round: number; answer: string[]; heard: boolean; playing: boolean; feedback: string; onListen: () => void; onChoose: (letter: string) => void }) {
  const choices: string[] = useMemo(() => shuffled(SPELL_WORDS[round].choices), [round]);
  const item = SPELL_WORDS[round];
  const done = answer.length === item.letters.length;
  const [lastChoice, setLastChoice] = useState("");
  useEffect(() => { setLastChoice(""); }, [round, playing]);
  return (
    <View style={styles.stage}>
      <Header kicker={`DELETREA · ${round + 1}/${SPELL_WORDS.length}`} title={`${item.word} · ${item.spanish}`} body="Escucha y toca las letras en orden." />
      <AudioAction label={playing ? "Reproduciendo deletreo" : "Escuchar deletreo"} playing={playing} disabled={playing || done} onPress={onListen} title={playing ? "Escuchando…" : "Escuchar deletreo"} />
      <View testID="spelling-response" style={styles.spellSlots} accessibilityLabel={`Respuesta: ${answer.join(", ") || "vacía"}`}>{item.letters.map((letter, index) => <View accessibilityLabel={`Letra ${index + 1}: ${answer[index]?.toUpperCase() || "vacía"}`} key={`${letter}-${index}`} style={[styles.spellSlot, answer[index] && styles.spellSlotFilled]}><Text style={styles.spellSlotText}>{answer[index]?.toUpperCase() || "·"}</Text></View>)}</View>
      <View testID="spelling-keyboard" style={[styles.answerRow, styles.keyboardRow]}>{choices.map((letter) => <AnswerTile keyboard key={letter} value={letter.toUpperCase()} disabled={!heard || done || playing}
        onPress={() => { setLastChoice(letter); onChoose(letter); }}
        state={letter === lastChoice ? (feedback ? "incorrect" : done ? "correct" : "selected") : "default"} />)}</View>
    </View>
  );
}

function SofiaChallenge({ onListen, playing }: { onListen: () => void; playing: boolean }) {
  return (
    <View style={styles.stage}>
      <Header kicker="UN ÚLTIMO FAVOR" title="El nombre de Sofía" body="Escucha las letras de su nombre." />
      <View style={styles.sofiaCard}>
        <Image testID="sofia-challenge-art" accessibilityLabel="Sofía" source={characterArt.sofia} style={[styles.sofiaImage, pixelImageStyle]} resizeMode="contain" resizeMethod="scale" />
        <View style={styles.sofiaDialogue}><Text style={styles.sofiaQuote}>“Escucha mi nombre.”</Text><Text style={styles.sofiaName}>SOFÍA</Text></View>
      </View>
      <AudioAction label="Escuchar el deletreo de Sofía" playing={playing} onPress={onListen} title={playing ? "Escuchando…" : "Escuchar SOFIA"} />
      <View style={styles.nameLetters}>{["S", "O", "F", "I", "A"].map((letter) => <View key={letter} style={styles.nameLetter}><Text style={styles.nameLetterText}>{letter}</Text></View>)}</View>
      <Text style={styles.note}>Puedes deletrear nombres, direcciones y códigos.</Text>
    </View>
  );
}

function Completion({ saveError }: { saveError: string }) {
  return (
    <View style={styles.stage}>
      <Header kicker="LECCIÓN COMPLETADA" title="¡Lo lograste!" body="Ya puedes reconocer letras y empezar a deletrear." />
      <View style={styles.medal}><Text style={styles.medalSmall}>LECCIÓN 000</Text><Text style={styles.medalLetter}>A</Text><Text style={styles.medalXp}>+10 XP</Text></View>
      <View style={styles.masteryCard}>{["Reconociste letras", "Construiste CAT y MAP", "Escuchaste el nombre de Sofía"].map((text) => <View key={text} style={styles.masteryRow}><Text style={styles.masteryCheck}>✓</Text><Text style={styles.masteryText}>{text}</Text></View>)}</View>
      {saveError ? <View style={[styles.notice, surfaces.incorrect]}><Text accessibilityLiveRegion="polite" style={styles.feedback}>{saveError}</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.purple },
  topbar: { minHeight: 68, paddingHorizontal: 18, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 12 },
  close: { minWidth: 48, minHeight: 48, padding: 6, alignItems: "center", justifyContent: "center" },
  closeText: { color: palette.navy, fontSize: 32, lineHeight: 38 },
  progressTrack: { flex: 1, height: 5, backgroundColor: palette.ivory, overflow: "hidden" },
  progressFill: { height: 5, backgroundColor: palette.yellow },
  counter: { ...lessonType.label, color: palette.ivory },
  scroll: { flexGrow: 1, width: "100%", maxWidth: 620, alignSelf: "center", padding: lessonSpace.page, gap: lessonSpace.gap },
  stage: { flexGrow: 1, justifyContent: "center", gap: lessonSpace.gap },
  footer: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: lessonSpace.page, paddingTop: 12, paddingBottom: 16, gap: 10, backgroundColor: palette.purple },
  primaryButton: { minHeight: lessonSpace.touch, paddingVertical: 14, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  buttonText: { ...lessonType.button, textAlign: "center", color: palette.navy },
  header: { ...surfaces.card, padding: 20, alignItems: "center", gap: 12 },
  kicker: { ...lessonType.label, color: palette.purple, textAlign: "center" },
  title: { ...lessonType.question, color: palette.navy, textAlign: "center" },
  subtitle: { ...lessonType.instruction, color: palette.navy, textAlign: "center", maxWidth: 480 },
  darkCard: { ...surfaces.card, padding: 18, gap: 12 },
  mapRow: { flexDirection: "row", gap: 14, alignItems: "center", paddingVertical: 8 },
  mapNumber: { ...surfaces.control, backgroundColor: palette.yellow, minWidth: 48, minHeight: 48, padding: 8, alignItems: "center", justifyContent: "center" },
  mapNumberText: { ...lessonType.label, color: palette.navy },
  mapTitle: { ...lessonType.button, color: palette.navy },
  mapCopy: { ...lessonType.helper, color: palette.navy },
  note: { ...lessonType.helper, color: palette.ivory, textAlign: "center" },
  heroLetterCard: { ...surfaces.card, padding: 24, minHeight: 180, alignItems: "center", justifyContent: "center", gap: 12 },
  heroLetters: { ...lessonType.hero, color: palette.navy, textAlign: "center" },
  heroCaption: { ...lessonType.helper, color: palette.navy, textAlign: "center" },
  visualCard: { ...surfaces.card, padding: 20, alignItems: "center", gap: 12 },
  visualImage: { width: 132, height: 132 },
  visualWord: { ...lessonType.target, color: palette.navy, textAlign: "center" },
  visualSpanish: { ...lessonType.instruction, color: palette.navy, textAlign: "center" },
  bigAudio: { alignSelf: "stretch", minHeight: 136, padding: 20, alignItems: "center", justifyContent: "center", gap: 12 },
  compactAudio: { flexDirection: "row", flexWrap: "wrap", alignSelf: "stretch", minHeight: 80, padding: 16, alignItems: "center", justifyContent: "center", gap: 8 },
  bigAudioIcon: { color: palette.navy, fontSize: 36, lineHeight: 44 },
  bigAudioLabel: { ...lessonType.button, flexShrink: 1, color: palette.navy, textAlign: "center" },
  answerRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: lessonSpace.tileGap },
  answerTile: { minWidth: 80, minHeight: 100, padding: 12, gap: 6, alignItems: "center", justifyContent: "center" },
  keyboardRow: { gap: 8 },
  keyboardKey: { minWidth: 64 },
  answerText: { ...lessonType.answer, color: palette.navy, textAlign: "center" },
  answerCue: { ...lessonType.label, color: palette.navy, textAlign: "center" },
  notice: { ...surfaces.card, padding: 16, gap: 6 },
  noticeCorrect: { borderTopWidth: 4, borderTopColor: palette.yellow },
  feedback: { ...lessonType.instruction, color: palette.navy, textAlign: "center" },
  feedbackIcon: { color: palette.error, fontWeight: "900" },
  feedbackScroll: { flexShrink: 1, flexGrow: 0 },
  alphabetGrid: { flexDirection: "row", flexWrap: "wrap", gap: lessonSpace.tileGap, justifyContent: "center" },
  alphaTile: { width: "28%", minWidth: 80, minHeight: 104, paddingVertical: 14, paddingHorizontal: 6, gap: 6, alignItems: "center", justifyContent: "center" },
  alphaText: { ...lessonType.answer, color: palette.navy, textAlign: "center" },
  selectedPanel: { ...surfaces.card, borderTopWidth: 4, borderTopColor: palette.yellow, padding: 18, alignItems: "center", gap: 8 },
  selectedBig: { ...lessonType.target, color: palette.navy, textAlign: "center" },
  selectedExample: { ...lessonType.instruction, color: palette.navy, textAlign: "center" },
  visitedBadgeText: { ...lessonType.helper, color: palette.purple, textAlign: "center" },
  spellSlots: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  spellSlot: { minWidth: 72, minHeight: 80, padding: 12, borderRadius: 4, backgroundColor: palette.ivory, borderWidth: 2, borderStyle: "dashed", borderColor: palette.navy, alignItems: "center", justifyContent: "center" },
  spellSlotFilled: { backgroundColor: palette.yellow, borderStyle: "solid" },
  spellSlotText: { ...lessonType.answer, color: palette.navy },
  sofiaCard: { ...surfaces.card, padding: 20, alignItems: "center" },
  sofiaImage: { width: 128, height: 192 },
  sofiaDialogue: { width: "100%", marginTop: -12, paddingTop: 12, backgroundColor: palette.ivory },
  sofiaQuote: { ...lessonType.dialogue, color: palette.navy, textAlign: "center" },
  sofiaName: { ...lessonType.target, color: palette.navy, textAlign: "center", marginTop: 12 },
  nameLetters: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12 },
  nameLetter: { ...surfaces.control, minWidth: 72, minHeight: 80, padding: 12, alignItems: "center", justifyContent: "center" },
  nameLetterText: { ...lessonType.answer, color: palette.navy },
  medal: { ...surfaces.card, borderTopWidth: 5, borderTopColor: palette.yellow, alignSelf: "center", maxWidth: "100%", padding: 24, alignItems: "center", gap: 12 },
  medalSmall: { ...lessonType.label, color: palette.navy, textAlign: "center" },
  medalLetter: { ...lessonType.hero, color: palette.navy },
  medalXp: { ...lessonType.question, color: palette.navy, backgroundColor: palette.yellow, paddingHorizontal: 12, paddingVertical: 8, textAlign: "center" },
  masteryCard: { ...surfaces.card, padding: 18, gap: 18 },
  masteryRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  masteryCheck: { color: palette.navy, backgroundColor: palette.yellow, padding: 4, fontSize: 24, lineHeight: 32 },
  masteryText: { ...lessonType.instruction, flex: 1, color: palette.navy },
});
