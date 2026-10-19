import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lessonType } from "./lessonTypography";
import { WelcomeArtwork, WelcomeWordmark, welcomeColors } from "./WelcomeArtwork";
import { StatusBar } from "expo-status-bar";
import { useReducedMotion } from "./useReducedMotion";
import { useAppSounds } from "./useAppSounds";

const { purple, ivory, navy } = welcomeColors;

export function AppIntro({
  visible,
  onPrepareNext,
  onFinished,
}: {
  visible: boolean;
  onPrepareNext: () => void;
  onFinished: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const horizontalPadding = { paddingLeft: 24 + insets.left, paddingRight: 24 + insets.right };
  const contentWidth = Math.max(0, Math.min(width - horizontalPadding.paddingLeft - horizontalPadding.paddingRight, 460));
  const usableHeight = height - insets.top - insets.bottom;
  const artworkWidth = Math.min(contentWidth, 360, Math.max(204, usableHeight * 0.33 * 360 / 340));
  const brandSize = Math.min(68, contentWidth * 0.19);
  const headlineSize = Math.min(44, Math.max(36, contentWidth * 0.12));
  const reducedMotion = useReducedMotion();
  const { play: playSound } = useAppSounds();
  const sceneOpacity = useRef(new Animated.Value(1)).current;
  const prepared = useRef(false);

  const onPrepareNextRef = useRef(onPrepareNext);
  const onFinishedRef = useRef(onFinished);
  onPrepareNextRef.current = onPrepareNext;
  onFinishedRef.current = onFinished;

  useEffect(() => {
    if (!visible) return;
    prepared.current = false;
    sceneOpacity.setValue(1);
    return () => sceneOpacity.stopAnimation();
  }, [visible, sceneOpacity]);

  useEffect(() => {
    if (visible && !reducedMotion && !prepared.current) playSound("intro");
  }, [visible, reducedMotion, playSound]);

  const begin = () => {
    if (prepared.current) return;
    prepared.current = true;
    playSound("tap");
    onPrepareNextRef.current();
    if (reducedMotion) { onFinishedRef.current(); return; }

    // Only the whole-screen exit fades. Nothing animates on entry or while idle.
    Animated.timing(sceneOpacity, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => { if (finished) onFinishedRef.current(); });
  };

  return (
    <Modal visible={visible} transparent animationType="none" presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === "android"} onRequestClose={() => {}}>
      <StatusBar hidden />
      <Animated.View style={[styles.root, { opacity: sceneOpacity }]}>
        <ScrollView style={styles.introScroll} bounces={false}
          contentContainerStyle={[styles.introContent, horizontalPadding, { paddingTop: Math.max(insets.top, 24) }]}>
          <View style={styles.contentColumn}>
            <WelcomeWordmark size={brandSize} />
            <WelcomeArtwork width={artworkWidth} />
            <View style={styles.copy}>
              <Text accessibilityRole="header" style={[styles.headline, { fontSize: headlineSize, lineHeight: headlineSize * 1.08 }]}>Tu inglés empieza aquí.</Text>
              <Text style={styles.support}>Escucha, practica y aprende a tu ritmo.</Text>
            </View>
          </View>
        </ScrollView>
        <View style={[styles.beginWrap, horizontalPadding, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.buttonColumn}>
            <Pressable accessibilityRole="button" accessibilityLabel="Comenzar" accessibilityHint="Entrar a Exprésate"
              onPress={begin}
              style={({ pressed }) => [styles.beginButton, pressed && styles.beginPressed]}>
              <Text style={styles.beginText}>Comenzar</Text>
              <View aria-hidden pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.arrowWrap}>
                <Text accessible={false} allowFontScaling={false} style={styles.beginArrow}>→</Text>
              </View>
            </Pressable>
            <Text style={styles.footer}>Paso a paso, contigo.</Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: purple },
  introScroll: { flex: 1, width: "100%" },
  introContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingBottom: 16 },
  contentColumn: { width: "100%", maxWidth: 460, alignItems: "center", gap: 18 },
  copy: { width: "100%", alignItems: "center", gap: 14 },
  headline: { color: "#FFFFFF", fontWeight: "900", letterSpacing: -1.2, textAlign: "center" },
  support: { fontSize: 20, lineHeight: 28, fontWeight: "500", color: "#FFFFFF", textAlign: "center" },
  beginWrap: { width: "100%", paddingTop: 12, alignItems: "center" },
  buttonColumn: { width: "100%", maxWidth: 460, gap: 14 },
  beginButton: { minHeight: 64, paddingVertical: 15, paddingHorizontal: 52, borderRadius: 4, borderWidth: 1.5, borderColor: navy, backgroundColor: ivory, justifyContent: "center", alignItems: "center" },
  beginPressed: { opacity: 0.85 },
  beginText: { ...lessonType.button, color: navy, textAlign: "center", fontWeight: "900" },
  arrowWrap: { position: "absolute", top: 0, bottom: 0, right: 16, justifyContent: "center" },
  beginArrow: { fontSize: 36, lineHeight: 42, fontWeight: "500", color: navy },
  footer: { ...lessonType.helper, color: "#FFFFFF", textAlign: "center" },
});
