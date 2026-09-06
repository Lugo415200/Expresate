import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { letters } from "./assets";

export function useLessonAudio() {
  const current = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  const cancel = useRef<(() => void) | null>(null);
  const version = useRef(0);
  const [playing, setPlaying] = useState(false),
    [error, setError] = useState("");
  function stop() {
    version.current++;
    cancel.current?.();
    cancel.current = null;
    current.current?.remove();
    current.current = null;
    setPlaying(false);
  }
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") stop();
    });
    return () => {
      subscription.remove();
      stop();
    };
  }, []);
  async function play(sequence: string[]) {
    stop();
    const ticket = version.current;
    setPlaying(true);
    setError("");
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });
      for (const letter of sequence) {
        if (ticket !== version.current) return false;
        const asset = letters[letter.toLowerCase()];
        if (!asset) throw new Error("Grabación no disponible.");
        const player = createAudioPlayer(asset.audio, { updateInterval: 100 });
        current.current = player;
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            cleanup();
            reject(
              new Error("No se pudo reproducir el audio. Inténtalo otra vez."),
            );
          }, 12000);
          const subscription = player.addListener(
            "playbackStatusUpdate",
            (status) => {
              if (status.didJustFinish) {
                cleanup();
                resolve();
              }
            },
          );
          function cleanup() {
            clearTimeout(timeout);
            subscription.remove();
            cancel.current = null;
          }
          cancel.current = () => {
            cleanup();
            resolve();
          };
          player.play();
        });
        if (ticket !== version.current) return false;
        player.remove();
        current.current = null;
      }
      return true;
    } catch (e: any) {
      if (ticket === version.current) setError(e.message);
      return false;
    } finally {
      if (ticket === version.current) {
        current.current?.remove();
        current.current = null;
        setPlaying(false);
      }
    }
  }
  return { play, stop, playing, error };
}
