import React, { useEffect, useState } from "react";
import { BackHandler, Image, ScrollView, Text, View } from "react-native";
import { lesson000 } from "../../../shared/lesson000-flow";
import { letters } from "./assets";
import { Button, Card, colors, s } from "./ui";
import { useLessonAudio } from "./useLessonAudio";
import { SpeechPractice } from "./SpeechPractice";
const content = require("../../../shared/lesson000");
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
  const [index, setIndex] = useState(0),
    [line, setLine] = useState(0),
    [answer, setAnswer] = useState<string[]>([]);
  const [heard, setHeard] = useState(false),
    [passed, setPassed] = useState(false),
    [feedback, setFeedback] = useState("");
  const [selected, setSelected] = useState("a"),
    [visited, setVisited] = useState<string[]>([]),
    [auditioned, setAuditioned] = useState<number | null>(null);
  const [saving, setSaving] = useState(false),
    [submitted, setSubmitted] = useState(false),
    [saveError, setSaveError] = useState("");
  const audio = useLessonAudio();
  const block = lesson000.blocks[index];
  const leave = () => {
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
  function next() {
    audio.stop();
    setIndex(index + 1);
    setLine(0);
    setAnswer([]);
    setHeard(false);
    setPassed(false);
    setFeedback("");
    setAuditioned(null);
  }
  async function listen(sequence: string[]) {
    if (await audio.play(sequence)) setHeard(true);
  }
  async function choose(value: string, tile: number) {
    if (passed || audio.playing) return;
    if (block.type === "spelling" && block.hidden && auditioned !== tile) {
      if (await audio.play([value])) {
        setAuditioned(tile);
        setFeedback("Toca la misma opción otra vez para elegirla.");
      }
      return;
    }
    if (block.type === "choice") {
      if (value === block.answer) {
        setPassed(true);
        setFeedback("¡Exacto!");
      } else setFeedback("Casi. Escucha otra vez.");
    } else if (block.type === "spelling") {
      if (value !== block.audio[answer.length]) {
        setFeedback("Casi. Escucha otra vez.");
        setAuditioned(null);
        return;
      }
      const result = [...answer, value];
      setAnswer(result);
      setAuditioned(null);
      if (result.length === block.audio.length) {
        setPassed(true);
        setFeedback("¡Lo lograste!");
      } else setFeedback("¡Bien! Sigue con la próxima letra.");
    }
  }
  const canContinue =
    block.type === "choice" || block.type === "spelling"
      ? passed
      : block.type === "alphabet"
        ? visited.length >= 3
        : block.type === "dialogue"
          ? line === block.lines.length - 1
          : true;
  return (
    <ScrollView
      key={block.id}
      style={s.screen}
      contentContainerStyle={s.content}
    >
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>LECCIÓN 000</Text>
          <Text style={s.muted}>
            {index + 1} de {lesson000.blocks.length}
          </Text>
        </View>
        <Button secondary title="Salir" onPress={leave} disabled={saving} />
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: lesson000.blocks.length,
          now: index + 1,
        }}
        style={{ height: 6, backgroundColor: colors.line, borderRadius: 3 }}
      >
        <View
          style={{
            height: 6,
            width: `${((index + 1) / lesson000.blocks.length) * 100}%`,
            backgroundColor: colors.blue,
            borderRadius: 3,
          }}
        />
      </View>
      <Text style={s.title}>{block.title}</Text>
      <Card>
        {block.type === "dialogue" && (
          <>
            <Image
              source={require("../../../assets/characters/sofia/greeting.webp")}
              style={{ width: "100%", height: 200 }}
              resizeMode="contain"
            />
            <Text style={s.eyebrow}>{block.lines[line].speaker}</Text>
            <Text style={s.body}>{block.lines[line].text}</Text>
            {line < block.lines.length - 1 && (
              <Button
                title="Siguiente diálogo"
                onPress={() => setLine(line + 1)}
              />
            )}
          </>
        )}
        {block.type === "instruction" && (
          <Text style={s.body}>{block.text}</Text>
        )}
        {block.type === "alphabet" && (
          <>
            <Text style={s.body}>
              Toca al menos tres letras. Escucha sus nombres y repítelos.
            </Text>
            <View style={s.row}>
              {Object.keys(letters).map((letter) => (
                <View key={letter} style={{ width: "20%" }}>
                  <Button
                    title={letter.toUpperCase()}
                    secondary={letter !== selected}
                    onPress={async () => {
                      setSelected(letter);
                      if (await audio.play([letter]))
                        setVisited((v) => [...new Set([...v, letter])]);
                    }}
                  />
                </View>
              ))}
            </View>
            <Image
              source={letters[selected].image}
              style={{ width: "100%", height: 160 }}
              resizeMode="contain"
              accessibilityLabel={content.letters[selected].spanish}
            />
            <Text style={s.heading}>{content.letters[selected].word}</Text>
            <Text style={s.muted}>
              {content.letters[selected].spanish} · {visited.length} letras
              escuchadas
            </Text>
          </>
        )}
        {(block.type === "choice" || block.type === "spelling") && (
          <>
            <Text style={s.body}>
              {block.type === "spelling" && block.hidden
                ? "Construye SOFIA. Escucha una opción y tócala otra vez para elegirla."
                : "Escucha y toca las letras en el orden correcto."}
            </Text>
            {!(block.type === "spelling" && block.hidden) && (
              <Button
                title={audio.playing ? "Escuchando…" : "Escuchar"}
                disabled={audio.playing}
                onPress={() => listen(block.audio)}
              />
            )}
            {block.type === "spelling" && (
              <Text style={[s.heading, { letterSpacing: 8 }]}>
                {block.audio
                  .map((_, i) => answer[i]?.toUpperCase() || "＿")
                  .join(" ")}
              </Text>
            )}
            <View style={s.row}>
              {block.choices.map((value, tile) => (
                <View key={tile} style={{ minWidth: 60 }}>
                  <Button
                    secondary
                    title={
                      block.type === "spelling" && block.hidden
                        ? `♪ ${tile + 1}`
                        : value.toUpperCase()
                    }
                    disabled={
                      passed ||
                      audio.playing ||
                      (!(block.type === "spelling" && block.hidden) && !heard)
                    }
                    onPress={() => choose(value, tile)}
                  />
                </View>
              ))}
            </View>
            {feedback ? (
              <Text accessibilityLiveRegion="polite" style={s.feedback}>
                {feedback}
              </Text>
            ) : null}
          </>
        )}
        {block.type === "speech" && (
          <>
            <Text style={s.body}>{block.text}</Text>
            <SpeechPractice />
          </>
        )}
        {block.type === "completion" && (
          <>
            <Image
              source={require("../../../assets/characters/sofia/celebrating.webp")}
              style={{ width: "100%", height: 220 }}
              resizeMode="contain"
            />
            <Text style={s.body}>
              Reconociste letras, construiste palabras y ayudaste a Sofía.
            </Text>
            <Text style={s.heading}>
              {completed
                ? "Lección completada · 10 XP"
                : pending
                  ? "Guardado en el teléfono"
                  : "Tu recompensa: 10 XP"}
            </Text>
            <Text style={s.muted}>
              {pending
                ? "Pendiente de sincronizar. Vuelve al curso y toca Actualizar con conexión."
                : completed
                  ? "Tu progreso está sincronizado. Repetir la lección no duplica XP."
                  : "Guarda tu resultado para continuar tu historia."}
            </Text>
            {saveError || (submitted && syncError) ? (
              <Text style={s.error}>{saveError || syncError}</Text>
            ) : null}
            {signedIn ? (
              <Button
                title={
                  saving
                    ? "Guardando…"
                    : submitted && !pending && completed
                      ? "Guardado ✓"
                      : "Guardar progreso"
                }
                disabled={saving || (submitted && !pending && completed)}
                onPress={async () => {
                  setSaving(true);
                  setSaveError("");
                  try {
                    await complete();
                    setSubmitted(true);
                  } catch (e: any) {
                    setSaveError(e.message);
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            ) : (
              <Button title="Iniciar sesión para guardar" onPress={login} />
            )}
            <Button
              secondary
              title="Volver al curso"
              onPress={leave}
              disabled={saving}
            />
          </>
        )}
        {audio.error ? <Text style={s.error}>{audio.error}</Text> : null}
      </Card>
      {block.type !== "completion" && (
        <Button
          title={block.type === "speech" ? "Continuar" : "Continuar →"}
          disabled={!canContinue || audio.playing}
          onPress={next}
        />
      )}
    </ScrollView>
  );
}
