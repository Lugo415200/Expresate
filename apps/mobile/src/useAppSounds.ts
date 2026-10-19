import { useCallback, useEffect, useMemo, useRef } from "react";
import { AppState, Platform } from "react-native";
import { Asset } from "expo-asset";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
const { createDialogueSoundController } = require("./dialogueSound");

const SOUND_ASSETS = {
  intro: require("../assets/sfx/intro.wav"),
  tap: require("../assets/sfx/tap.wav"),
  success: require("../assets/sfx/success.wav"),
  wrong: require("../assets/sfx/wrong.wav"),
  consejo: require("../assets/sfx/consejo.wav"),
  transition: require("../assets/sfx/transition.wav"),
  dialogue: require("../assets/sfx/dialogue.wav"),
} as const;

export type AppSound = keyof typeof SOUND_ASSETS;

/** One preloaded, reusable blip player; no per-character player allocation. */
function createDialoguePlayer() {
  if (Platform.OS === "web") {
    // Expo's web play() discards its Promise. Own this decorative media element
    // so a pause/dispose during pending playback cannot cause an unhandled AbortError.
    const media = new Audio(Asset.fromModule(SOUND_ASSETS.dialogue).uri);
    media.preload = "auto";
    media.load();
    return {
      get isLoaded() { return media.readyState >= 2; },
      set volume(value: number) { media.volume = value; },
      async seekTo(seconds: number) { media.currentTime = seconds; },
      play: () => media.play(),
      pause: () => media.pause(),
      onFinish(callback: () => void) {
        media.addEventListener("ended", callback);
        return { remove: () => media.removeEventListener("ended", callback) };
      },
      remove() { media.pause(); media.removeAttribute("src"); media.load(); },
    };
  }
  const player = createAudioPlayer(SOUND_ASSETS.dialogue, {
    updateInterval: 50,
    keepAudioSessionActive: true,
  });
  return {
    get isLoaded() { return player.isLoaded; },
    set volume(value: number) { player.volume = value; },
    seekTo: (seconds: number) => player.seekTo(seconds),
    play: () => player.play(),
    pause: () => player.pause(),
    onFinish(callback: () => void) {
      return player.addListener("playbackStatusUpdate", status => { if (status.didJustFinish) callback(); });
    },
    remove: () => player.remove(),
  };
}

export function useDialogueSounds() {
  const controller = useRef<ReturnType<typeof createDialogueSoundController> | null>(null);
  const sound = useMemo(() => ({
    begin: (volume: number) => controller.current?.begin(volume),
    pulse: () => controller.current?.pulse(),
    finish: () => controller.current?.finish(),
    stop: () => controller.current?.stop(),
  }), []);
  useEffect(() => {
    const current = createDialogueSoundController(createDialoguePlayer);
    controller.current = current;
    current.setActive(AppState.currentState === null || AppState.currentState === "active");
    void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => undefined);
    const subscription = AppState.addEventListener("change", state => current.setActive(state === "active"));
    return () => { subscription.remove(); current.dispose(); controller.current = null; };
  }, [sound]);
  return sound;
}

export function useAppSounds() {
  const activePlayers = useRef(new Set<ReturnType<typeof createAudioPlayer>>());

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
    }).catch(() => undefined);

    return () => {
      activePlayers.current.forEach((player) => player.remove());
      activePlayers.current.clear();
    };
  }, []);

  const play = useCallback((sound: AppSound) => {
    try {
      const player = createAudioPlayer(SOUND_ASSETS[sound], {
        updateInterval: 100,
      });
      activePlayers.current.add(player);
      const subscription = player.addListener("playbackStatusUpdate", (status) => {
        if (!status.didJustFinish) return;
        subscription.remove();
        activePlayers.current.delete(player);
        player.remove();
      });
      player.play();
    } catch {
      // Sound effects are decorative and should never block the lesson flow.
    }
  }, []);

  return { play };
}
