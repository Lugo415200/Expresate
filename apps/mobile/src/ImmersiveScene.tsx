import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageBackground,
  ImageSourcePropType,
  PixelRatio,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lessonType } from "./lessonTypography";
import { colors } from "./ui";
import { useReducedMotion } from "./useReducedMotion";
import { useDialogueSounds } from "./useAppSounds";
import { WelcomeWordmark, welcomeColors } from "./WelcomeArtwork";
const { createTextCadence, DIALOGUE_SOUND_DEFAULTS } = require("./dialogueSound");

export type SceneEvent = "scene-enter" | "line-enter" | "advance" | "exit";

type ImmersiveSceneProps = {
  background: ImageSourcePropType;
  character: ImageSourcePropType;
  characterLabel: string;
  characterSide?: "left" | "right";
  characterAspectRatio?: number;
  stationaryCharacter?: boolean;
  instantDialogue?: boolean;
  characterPixelGrid?: { width: number; height: number; minimumScale?: number };
  locationLabel?: string;
  speaker: string;
  text: string;
  progress: number;
  counterText: string;
  nextLabel: string;
  sceneKey: string;
  onAdvance: () => void;
  onExit: () => void;
  onSceneEvent?: (event: SceneEvent) => void;
  typewriterSound?: { enabled?: boolean; cadence?: number; volume?: number };
  appearance?: "classroom" | "welcome";
  showBackground?: boolean;
};

/**
 * Reusable edge-to-edge story shell for Exprésate native lessons.
 * Background art intentionally extends behind iOS safe areas while controls
 * and dialogue are inset into tappable safe positions.
 */
export function ImmersiveScene({
  background,
  character,
  characterLabel,
  characterSide = "right",
  characterAspectRatio,
  stationaryCharacter = false,
  instantDialogue = false,
  characterPixelGrid,
  locationLabel = "AULA DE INGLÉS",
  speaker,
  text,
  progress,
  counterText,
  nextLabel,
  sceneKey,
  onAdvance,
  onExit,
  onSceneEvent,
  typewriterSound,
  appearance = "classroom",
  showBackground = appearance === "classroom",
}: ImmersiveSceneProps) {
  const isWelcome = appearance === "welcome";
  const reducedMotion = useReducedMotion();
  const dialogueSound = useDialogueSounds();
  const soundEnabled = typewriterSound?.enabled ?? DIALOGUE_SOUND_DEFAULTS.enabled;
  const soundCadence = typewriterSound?.cadence ?? DIALOGUE_SOUND_DEFAULTS.cadence;
  const soundVolume = typewriterSound?.volume ?? DIALOGUE_SOUND_DEFAULTS.volume;
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const stopTyping = useRef(() => {});
  const lastAdvance = useRef(0);
  const [topBarHeight, setTopBarHeight] = useState(44);
  const [dialogueHeight, setDialogueHeight] = useState(220);
  const [nameplateHeight, setNameplateHeight] = useState(42);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const sceneOpacity = useRef(new Animated.Value(isWelcome ? 1 : 0)).current;
  const sceneScale = useRef(new Animated.Value(isWelcome ? 1 : 1.018)).current;
  const characterOpacity = useRef(new Animated.Value(isWelcome ? 1 : 0)).current;
  const characterX = useRef(
    new Animated.Value(isWelcome ? 0 : characterSide === "right" ? 34 : -34),
  ).current;
  const characterY = useRef(new Animated.Value(isWelcome ? 0 : 10)).current;
  const idleY = useRef(new Animated.Value(0)).current;
  const dialogueY = useRef(new Animated.Value(isWelcome ? 0 : 28)).current;
  const dialogueOpacity = useRef(new Animated.Value(isWelcome ? 1 : 0)).current;
  const dialogueScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reducedMotion || isWelcome) {
      sceneOpacity.setValue(1); sceneScale.setValue(1);
      if (isWelcome && !reducedMotion) onSceneEvent?.("scene-enter");
      return;
    }
    sceneOpacity.setValue(0);
    sceneScale.setValue(1.018);
    const animation = Animated.parallel([
      Animated.timing(sceneOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(sceneScale, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    onSceneEvent?.("scene-enter");
    return () => animation.stop();
  }, [reducedMotion, isWelcome]);

  useEffect(() => {
    if (reducedMotion || instantDialogue) { dialogueSound.stop(); stopTyping.current = () => {}; setTypedText(text); setIsTyping(false); return; }
    const characters = Array.from(text);
    const shouldBlip = createTextCadence(soundCadence);
    let index = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    stopTyping.current = () => { cancelled = true; if (timer) clearTimeout(timer); dialogueSound.stop(); };
    if (soundEnabled) dialogueSound.begin(soundVolume);
    else dialogueSound.stop();
    setTypedText("");
    setIsTyping(true);

    const typeNext = () => {
      if (cancelled) return;
      index += 1;
      setTypedText(characters.slice(0, index).join(""));

      if (index >= characters.length) {
        dialogueSound.finish();
        setIsTyping(false);
        return;
      }

      const previous = characters[index - 1];
      if (soundEnabled && shouldBlip(previous)) void dialogueSound.pulse();
      const delay = /[.!?]/.test(previous)
        ? 180
        : /[,;:]/.test(previous)
          ? 90
          : previous === " "
            ? 18
            : 30;
      timer = setTimeout(typeNext, delay);
    };

    timer = setTimeout(typeNext, 180);

    return () => {
      stopTyping.current();
    };
  }, [sceneKey, text, reducedMotion, instantDialogue, dialogueSound, soundEnabled, soundCadence, soundVolume]);

  useEffect(() => {
    if (reducedMotion || isWelcome) {
      characterOpacity.setValue(1); characterX.setValue(0); characterY.setValue(0); dialogueY.setValue(0); dialogueOpacity.setValue(1);
      if (isWelcome && !reducedMotion) onSceneEvent?.("line-enter");
      return;
    }
    characterOpacity.setValue(0);
    characterX.setValue(characterSide === "right" ? 34 : -34);
    characterY.setValue(10);
    dialogueY.setValue(28);
    dialogueOpacity.setValue(0);

    const animation = Animated.parallel([
      Animated.timing(characterOpacity, {
        toValue: 1,
        duration: 230,
        useNativeDriver: true,
      }),
      Animated.spring(characterX, {
        toValue: 0,
        damping: 18,
        stiffness: 155,
        mass: 0.72,
        useNativeDriver: true,
      }),
      Animated.spring(characterY, {
        toValue: 0,
        damping: 18,
        stiffness: 150,
        mass: 0.72,
        useNativeDriver: true,
      }),
      Animated.timing(dialogueOpacity, {
        toValue: 1,
        duration: 210,
        delay: 70,
        useNativeDriver: true,
      }),
      Animated.spring(dialogueY, {
        toValue: 0,
        damping: 20,
        stiffness: 180,
        mass: 0.72,
        delay: 55,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    onSceneEvent?.("line-enter");
    return () => animation.stop();
  }, [sceneKey, characterSide, reducedMotion, isWelcome]);

  useEffect(() => {
    if (reducedMotion || stationaryCharacter) { idleY.setValue(0); return; }
    const idle = Animated.loop(
      Animated.sequence([
        Animated.timing(idleY, {
          toValue: -3,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(idleY, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    idle.start();
    return () => idle.stop();
  }, [reducedMotion, stationaryCharacter]);

  const dialogueBottom = Math.max(insets.bottom, 8) + 8;
  const top = Math.max(insets.top, 8) + 4;
  const topProgress = top + topBarHeight + 8;
  // The welcome panel masks the canvas edge, including the 3px character idle.
  // Other lesson scenes keep their existing composition.
  const characterBottom = dialogueBottom + dialogueHeight + (isWelcome ? -12 : 12);
  const characterHeight = Math.max(0, height - characterBottom - topProgress - 18);
  const usableWidth = width - insets.left - insets.right;
  const characterWidth = Math.min(isWelcome ? usableWidth - 40 : width - 32, 520);
  const minimumPortraitSpace = characterPixelGrid
    ? Math.max(100, characterPixelGrid.height * (characterPixelGrid.minimumScale ?? 1) / PixelRatio.get() + 24) : 100;
  let artworkWidth = isWelcome && characterAspectRatio
    ? Math.min(characterWidth, characterHeight * characterAspectRatio) : characterWidth;
  let artworkHeight = isWelcome && characterAspectRatio ? artworkWidth / characterAspectRatio : characterHeight;
  if (characterPixelGrid) {
    // Whole logical sprite pixels in physical display pixels. Round down so the
    // portrait stays below the header even with a tall, scaled dialogue panel.
    const density = PixelRatio.get();
    const capacity = Math.max(0, Math.min(
      characterWidth * density / characterPixelGrid.width,
      characterHeight * density / characterPixelGrid.height,
    ));
    // Prefer whole pixels. A fine concept may opt into half-size on a small,
    // low-density viewport so enlarged dialogue still has room to scroll.
    const minimumScale = characterPixelGrid.minimumScale ?? 1;
    const scale = Math.floor(capacity) || (capacity >= minimumScale ? minimumScale : 0);
    artworkWidth = characterPixelGrid.width * scale / density;
    artworkHeight = characterPixelGrid.height * scale / density;
  }

  function advance() {
    const now = Date.now();
    if (now - lastAdvance.current < 350) return;
    lastAdvance.current = now;
    if (isTyping) {
      stopTyping.current();
      setTypedText(text);
      setIsTyping(false);
      return;
    }

    // The next line supplies its own cue; do not start a player just before unmount.
    dialogueSound.stop();
    onSceneEvent?.("advance");
    onAdvance();
  }

  function exit() {
    stopTyping.current();
    dialogueSound.stop();
    onSceneEvent?.("exit");
    onExit();
  }

  return (
    <View testID={isWelcome ? "orientation-dialogue" : undefined} style={[styles.root, isWelcome && welcomeStyles.root]}>
      {showBackground ? <Animated.View
        testID="story-classroom-background"
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { opacity: sceneOpacity, transform: [{ scale: sceneScale }] },
        ]}
      >
        <ImageBackground source={background} resizeMode="cover" style={styles.background}>
          <View style={styles.scrim} />
          <View style={[styles.topShade, { height: topProgress + 72 }]} />
        </ImageBackground>
      </Animated.View> : null}

      <View onLayout={event => setTopBarHeight(event.nativeEvent.layout.height)} style={[styles.topBar, { top }, isWelcome && { left: 24 + insets.left, right: 24 + insets.right }]} pointerEvents="box-none">
        <View style={[styles.locationPill, isWelcome && welcomeStyles.location]}>
          {isWelcome ? <WelcomeWordmark size={30} /> : null}
          <Text style={[styles.locationText, isWelcome && showBackground && welcomeStyles.artworkLocationText]}>{locationLabel}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Salir de la lección"
          hitSlop={12}
          onPress={exit}
          style={({ pressed }) => [styles.exitButton, isWelcome && welcomeStyles.exitButton, pressed && styles.controlPressed]}
        >
          <Text style={[styles.exitText, isWelcome && welcomeStyles.exitText]}>✕</Text>
        </Pressable>
      </View>

      <View testID={isWelcome ? "orientation-story-progress" : undefined} style={[styles.progressTrack, { top: topProgress }, isWelcome && welcomeStyles.progressTrack]}>
        <View style={[styles.progressFill, isWelcome && welcomeStyles.progressFill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.characterStage,

          {
            width: characterWidth,
            height: characterHeight,
            left: isWelcome ? insets.left + (usableWidth - characterWidth) / 2 : (width - characterWidth) / 2,
            bottom: characterBottom,
            opacity: characterOpacity,
            transform: [
              { translateX: characterX },
              { translateY: Animated.add(characterY, idleY) },
            ],
          },
        ]}
      >
        <Image
          key={sceneKey}
          source={character}
          resizeMode="contain"
          resizeMethod={characterPixelGrid ? "scale" : undefined}
          style={[styles.character, isWelcome && { width: artworkWidth, height: artworkHeight, alignSelf: "center",
            ...(Platform.OS === "web" && characterPixelGrid ? { imageRendering: "pixelated" } : {}),
          }]}
          accessibilityLabel={characterLabel}
        />
      </Animated.View>

      <Animated.View
        onLayout={(event) => setDialogueHeight(event.nativeEvent.layout.height)}
        style={[
          styles.dialogueDock,
          isWelcome && { left: 16 + insets.left, right: 16 + insets.right },
          {
            bottom: dialogueBottom,
            maxHeight: Math.min(height * 0.62, height - topProgress - dialogueBottom - minimumPortraitSpace),
            opacity: dialogueOpacity,
            transform: [{ translateY: dialogueY }, { scale: dialogueScale }],
          },
        ]}
      >
        <View style={[styles.dialoguePressable, isWelcome && welcomeStyles.panelShell]}>
          <View testID={isWelcome ? "orientation-speaker-badge" : undefined} onLayout={event => setNameplateHeight(event.nativeEvent.layout.height)}
            style={[styles.nameplate, isWelcome && welcomeStyles.nameplate, isWelcome && { top: -nameplateHeight / 2 }]}>
            <Text style={[styles.nameplateText, isWelcome && welcomeStyles.ink]}>{speaker}</Text>
          </View>
          <View testID={isWelcome ? "orientation-dialogue-panel" : undefined} style={[styles.dialogueBox, isWelcome && welcomeStyles.dialogueBox, isWelcome && { paddingTop: nameplateHeight / 2 + 12 }]}>
            <ScrollView bounces={false} style={styles.dialogueScroll}>
              <Pressable accessibilityRole="button" accessibilityLabel={`${speaker}: ${text}. ${isTyping ? "Mostrar diálogo completo" : nextLabel}`} onPress={advance}>
                <View>
                  <Text accessible={false} style={[styles.dialogueText, isWelcome && welcomeStyles.ink, { opacity: 0 }]}>{text}▌</Text>
                  <Text accessibilityLabel={text} style={[styles.dialogueText, isWelcome && welcomeStyles.ink, StyleSheet.absoluteFill]}>
                    {typedText}{isTyping ? <Text style={[styles.typeCursor, isWelcome && welcomeStyles.ink]}>▌</Text> : null}
                  </Text>
                </View>
              </Pressable>
            </ScrollView>
            {isWelcome ? <View style={[styles.dialogueFooter, welcomeStyles.dialogueFooter]}>
              <Text style={[styles.counter, welcomeStyles.ink]}>{counterText}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={isTyping ? "Mostrar diálogo completo" : nextLabel}
                onPress={advance} style={({ pressed }) => [welcomeStyles.nextHint, pressed && welcomeStyles.primaryPressed]}>
                <Text style={[styles.nextHint, welcomeStyles.ink]}>{isTyping ? "Ver todo" : nextLabel}</Text>
              </Pressable>
            </View> : <Pressable accessibilityRole="button" accessibilityLabel={isTyping ? "Mostrar diálogo completo" : nextLabel}
              onPress={advance} style={styles.dialogueFooter}>
              <Text style={styles.counter}>{counterText}</Text>
              <Text style={styles.nextHint}>{isTyping ? "Ver todo" : nextLabel}</Text>
            </Pressable>}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#071126",
  },
  background: {
    flex: 1,
  },
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(7, 13, 31, 0.08)",
  },
  topShade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(4, 9, 24, 0.18)",
  },
  topBar: {
    gap: 8,
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationPill: {
    flexShrink: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(9, 15, 35, 0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  locationText: {
    color: "#fff",
    ...lessonType.label,
  },
  exitButton: {
    width: 44,
    height: 44,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9, 15, 35, 0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },
  exitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  controlPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  progressTrack: {
    position: "absolute",
    left: 18,
    right: 18,
    height: 3,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
    zIndex: 18,
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  characterStage: {
    position: "absolute",
    justifyContent: "flex-end",
    zIndex: 5,
  },
  character: {
    width: "100%",
    height: "100%",
  },
  dialogueDock: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 30,
  },
  dialoguePressable: {
    flexShrink: 1,
    borderRadius: 24,
  },
  nameplate: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginBottom: -11,
    zIndex: 2,
    backgroundColor: colors.blue,
    borderRadius: 11,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.96)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  nameplateText: {
    color: "#fff",
    ...lessonType.button,
  },
  dialogueBox: {
    flexShrink: 1,
    borderRadius: 24,
    backgroundColor: "rgba(5,7,12,0.96)",
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.19,
    shadowRadius: 20,
    elevation: 8,
  },
  dialogueScroll: { flexShrink: 1 },
  dialogueText: {
    ...lessonType.dialogue,
    color: "#ffffff",
  },
  typeCursor: {
    color: "rgba(255,255,255,0.72)",
    fontWeight: "900",
  },
  dialogueFooter: {
    minHeight: 56,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  counter: {
    color: "rgba(255,255,255,0.62)",
    ...lessonType.label,
  },
  nextHint: {
    flexShrink: 1,
    textAlign: "right",
    color: "#ffffff",
    ...lessonType.button,
  },
});

// Applied only to the opening orientation story, never the exercise screens.
const welcomeStyles = StyleSheet.create({
  root: { backgroundColor: welcomeColors.purple },
  location: { paddingHorizontal: 0, paddingVertical: 0, borderWidth: 0, borderRadius: 0, backgroundColor: "transparent", gap: 6, alignItems: "flex-start" },
  artworkLocationText: { backgroundColor: welcomeColors.navy, color: welcomeColors.ivory, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  exitButton: { width: "auto", height: "auto", minWidth: 48, minHeight: 48, padding: 6, borderRadius: 4, borderWidth: 1.5, borderColor: welcomeColors.navy, backgroundColor: welcomeColors.ivory, boxShadow: "2px 3px 0px #0B1332" },
  exitText: { color: welcomeColors.navy, fontSize: 22, lineHeight: 28 },
  progressTrack: { height: 4, borderRadius: 0, backgroundColor: welcomeColors.ivory },
  progressFill: { borderRadius: 0, backgroundColor: welcomeColors.yellow },
  panelShell: { borderRadius: 6 },
  nameplate: { position: "absolute", left: 0, marginLeft: 0, marginBottom: 0, borderRadius: 4, borderWidth: 1.5, borderColor: welcomeColors.navy, backgroundColor: welcomeColors.yellow, shadowOpacity: 0, elevation: 0, paddingVertical: 6, paddingHorizontal: 12 },
  dialogueBox: { borderRadius: 6, borderWidth: 1.5, borderColor: welcomeColors.navy, backgroundColor: welcomeColors.ivory, paddingTop: 18, paddingBottom: 14, shadowOpacity: 0, elevation: 0, boxShadow: "3px 4px 0px #0B1332" },
  ink: { color: welcomeColors.navy },
  dialogueFooter: { minHeight: 64, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#D6D1BC" },
  nextHint: { flexShrink: 1, minHeight: 48, justifyContent: "center", borderWidth: 1.5, borderColor: welcomeColors.navy, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: welcomeColors.yellow, boxShadow: "2px 3px 0px #0B1332" },
  primaryPressed: { transform: [{ translateX: 1 }, { translateY: 2 }], opacity: 0.85, boxShadow: "1px 1px 0px #0B1332" },
});
