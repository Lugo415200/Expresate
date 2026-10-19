import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { useReducedMotion } from "./useReducedMotion";

const TILE_COLORS = ["#4358F4", "#5360F7", "#6D5DFC", "#795CF8", "#8B5CF6"];
const TILE_DELAYS = [0, 80, 160, 240, 320];

export function BrandTransition({
  visible,
  onCovered,
  onFinished,
}: {
  visible: boolean;
  onCovered: () => void;
  onFinished: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const tiles = useMemo(
    () => TILE_COLORS.map(() => new Animated.Value(0)),
    [],
  );
  const markOpacity = useRef(new Animated.Value(0)).current;
  const markScale = useRef(new Animated.Value(0.96)).current;
  const hasCovered = useRef(false);
  const onCoveredRef = useRef(onCovered);
  const onFinishedRef = useRef(onFinished);
  onCoveredRef.current = onCovered;
  onFinishedRef.current = onFinished;

  useEffect(() => {
    if (!visible) {
      tiles.forEach((tile) => tile.setValue(0));
      markOpacity.setValue(0);
      markScale.setValue(0.96);
      hasCovered.current = false;
      return;
    }

    if (reducedMotion) { onCoveredRef.current(); onFinishedRef.current(); return; }
    hasCovered.current = false;

    const enterTiles = tiles.map((tile, index) =>
      Animated.timing(tile, {
        toValue: 1,
        duration: 550,
        delay: TILE_DELAYS[index],
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: false,
      }),
    );

    const enterMark = Animated.parallel([
      Animated.timing(markOpacity, {
        toValue: 1,
        duration: 280,
        delay: 550,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(markScale, {
        toValue: 1,
        duration: 280,
        delay: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const entry = Animated.parallel([...enterTiles, enterMark]);
    entry.start();

    const coveredTimer = setTimeout(() => {
      if (hasCovered.current) return;
      hasCovered.current = true;
      onCoveredRef.current();
    }, 620);

    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(markOpacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        ...tiles.map((tile, index) =>
          Animated.timing(tile, {
            toValue: 0,
            duration: 520,
            delay: (tiles.length - 1 - index) * 55,
            easing: Easing.bezier(0.7, 0, 0.84, 0),
            useNativeDriver: false,
          }),
        ),
      ]).start(() => onFinishedRef.current());
    }, 1120);

    return () => {
      clearTimeout(coveredTimer);
      clearTimeout(exitTimer);
      entry.stop();
    };
  }, [reducedMotion, visible, markOpacity, markScale, tiles]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === "android"}
      onRequestClose={() => {}}
    >
      <StatusBar hidden />
      <View style={styles.root} pointerEvents="auto" accessibilityViewIsModal>
        {tiles.map((tile, index) => (
          <Animated.View
            key={index}
            style={[
              styles.tile,
              {
                top: `${index * 20}%`,
                backgroundColor: TILE_COLORS[index],
                width: tile.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        ))}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.markWrap,
            {
              opacity: markOpacity,
              transform: [{ scale: markScale }],
            },
          ]}
        >
          <Text style={styles.mark}>Exprésate</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  tile: {
    position: "absolute",
    left: 0,
    height: "20%",
  },
  markWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "44%",
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    color: "#FFFFFF",
    fontSize: 46,
    lineHeight: 54,
    fontWeight: "800",
    letterSpacing: -1.2,
    textShadowColor: "rgba(17,24,39,0.22)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 16,
  },
});
