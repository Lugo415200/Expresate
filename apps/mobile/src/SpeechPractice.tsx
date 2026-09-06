import React, { useEffect, useState } from "react";
import { Text, AppState } from "react-native";
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { Button, s } from "./ui";
export function SpeechPractice() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const playback = useAudioPlayer(null);
  const [uri, setUri] = useState<string | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function finish() {
    await recorder.stop();
    setUri(recorder.uri);
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  }
  useEffect(() => {
    const sub = AppState.addEventListener("change", (value) => {
      if (value !== "active" && recorder.isRecording)
        void recorder.stop().catch(() => {});
    });
    return () => {
      sub.remove();
      // useAudioRecorder owns disposal; don't read a released native recorder.
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, [recorder]);
  useEffect(() => {
    if (state.isRecording && state.durationMillis >= 30000)
      void finish().catch((e) => setError(e.message));
  }, [state.durationMillis]);
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      playback.pause();
      if (state.isRecording) await finish();
      else {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted)
          throw new Error(
            "Puedes continuar sin micrófono o permitirlo desde los ajustes del teléfono.",
          );
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
        await recorder.prepareToRecordAsync();
        recorder.record();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Text style={s.muted}>
        Tu grabación queda en la caché de este teléfono; no se sube a Supabase.
        Sin puntuación automática.
      </Text>
      <Button
        title={
          state.isRecording
            ? `Detener · ${Math.floor(state.durationMillis / 1000)} s`
            : "Grabar mi voz"
        }
        disabled={busy}
        onPress={toggle}
      />
      {uri && !state.isRecording ? (
        <Button
          secondary
          title="Escuchar mi voz"
          onPress={() => {
            playback.replace({ uri });
            playback.play();
          }}
        />
      ) : null}
      {error ? <Text style={s.error}>{error}</Text> : null}
    </>
  );
}
