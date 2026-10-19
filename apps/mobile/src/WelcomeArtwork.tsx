import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const welcomeColors = { purple: "#4B3FF4", ivory: "#FFFCED", navy: "#0B1332", yellow: "#FFDF35" };
const { ivory, navy, yellow } = welcomeColors;

/** Live type, with a solid duplicate rather than a blurred platform shadow. */
export function WelcomeWordmark({ size }: { size: number }) {
  const textStyle = { fontSize: size, lineHeight: size * 1.18, letterSpacing: -size * 0.055 };
  // Negative tracking reduces the text's measured advance, but not the last
  // glyph's ink. Reserve that overhang inside the final Text drawing bounds.
  const endBearing = { paddingRight: Math.ceil(size * 0.055) + 2 };
  const run = (text: string, last = false) => <View style={styles.brandRun}>
    <Text testID={last ? "welcome-wordmark-final-shadow" : undefined} accessible={false} allowFontScaling={false} style={[styles.brandText, textStyle, last && endBearing, styles.brandShadow]}>{text}</Text>
    <Text testID={last ? "welcome-wordmark-final" : undefined} accessible={false} allowFontScaling={false} style={[styles.brandText, textStyle, last && endBearing]}>{text}</Text>
  </View>;
  return <View testID="welcome-wordmark" accessible accessibilityRole="header" accessibilityLabel="Exprésate" style={styles.wordmark}>
    <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.brandRow}>
      {run("Expr")}
      <View>
        {run("e")}
        <View style={[styles.acuteShadow, { top: size * 0.03 + 3, left: size * 0.14 + 2, width: size * 0.27, height: size * 0.17 }]} />
        <View style={[styles.acute, { top: size * 0.03, left: size * 0.14, width: size * 0.27, height: size * 0.17 }]} />
      </View>
      {run("sate", true)}
    </View>
    <View style={styles.underlineShadow} />
    <View style={styles.underline} />
  </View>;
}

/** Native geometry on a scalable canvas; no bitmap, font download, or SVG dependency. */
export function WelcomeArtwork({ width }: { width: number }) {
  const scale = width / 360;
  return <View testID="welcome-artwork" aria-hidden pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ width, height: 340 * scale }}>
    <View style={[styles.canvas, { left: (width - 360) / 2, top: (340 * scale - 340) / 2, transform: [{ scale }] }]}>
      {[{ upper: "A", lower: "a", left: 36, top: 16, rotate: "-10deg" }, { upper: "B", lower: "b", left: 176, top: 107, rotate: "14deg" }].map((card, index) => (
        <View key={card.upper} testID={`welcome-card-${card.upper}`} style={[styles.card, { left: card.left, top: card.top, zIndex: index + 1,
          transform: [{ rotate: card.rotate }] }]}>
          <View style={styles.cardShadow} />
          <View style={styles.cardFace}>
            <Text accessible={false} allowFontScaling={false} style={styles.capital}>{card.upper}</Text>
            <Text accessible={false} allowFontScaling={false} style={styles.lowercase}>{card.lower}</Text>
          </View>
        </View>
      ))}
      <View style={styles.bubble}>
        <View style={styles.dots}>{[0, 1, 2].map(n => <View key={n} style={styles.dot} />)}</View>
        <View style={styles.tailOutline} /><View style={styles.tailFill} />
      </View>
      <View style={[styles.stroke, { left: 329, top: 52, transform: [{ rotate: "40deg" }] }]} />
      <View style={[styles.stroke, { left: 339, top: 81, height: 31, transform: [{ rotate: "68deg" }] }]} />
      <View style={[styles.stroke, { left: 12, top: 233, height: 30, transform: [{ rotate: "73deg" }] }]} />
      <View style={[styles.stroke, { left: 17, top: 261, height: 33, transform: [{ rotate: "42deg" }] }]} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wordmark: { alignSelf: "center", paddingBottom: 9, paddingRight: 2, overflow: "visible" },
  brandRow: { flexDirection: "row", alignItems: "center", overflow: "visible" },
  brandRun: { overflow: "visible" },
  brandText: { color: ivory, fontWeight: "900", includeFontPadding: false },
  brandShadow: { position: "absolute", top: 4, left: 1, color: navy },
  acute: { position: "absolute", backgroundColor: yellow, transform: [{ skewX: "-30deg" }] },
  acuteShadow: { position: "absolute", backgroundColor: navy, transform: [{ skewX: "-30deg" }] },
  underline: { position: "absolute", right: 0, bottom: 1, width: "31%", height: 6, borderRadius: 3, backgroundColor: yellow },
  underlineShadow: { position: "absolute", right: -1, bottom: -1, width: "31%", height: 6, borderRadius: 3, backgroundColor: navy },
  canvas: { position: "absolute", width: 360, height: 340 },
  card: { position: "absolute", width: 144, height: 200 },
  cardShadow: { position: "absolute", left: 3, top: 8, width: 144, height: 200, borderRadius: 7, backgroundColor: navy },
  cardFace: { width: 144, height: 200, borderRadius: 7, borderWidth: 1.5, borderColor: navy, backgroundColor: ivory, alignItems: "center", justifyContent: "center" },
  capital: { fontSize: 102, lineHeight: 108, fontWeight: "900", includeFontPadding: false, color: navy, textAlign: "center" },
  lowercase: { fontSize: 74, lineHeight: 78, fontWeight: "900", includeFontPadding: false, color: navy, textAlign: "center" },
  bubble: { position: "absolute", left: 217, top: 21, width: 86, height: 46, borderWidth: 1.5, borderColor: navy, backgroundColor: ivory, transform: [{ rotate: "2deg" }], justifyContent: "center", alignItems: "center" },
  dots: { flexDirection: "row", gap: 10 },
  dot: { width: 8, height: 9, backgroundColor: navy },
  tailOutline: { position: "absolute", left: 4, bottom: -18, width: 0, height: 0, borderTopWidth: 18, borderRightWidth: 22, borderTopColor: navy, borderRightColor: "transparent" },
  tailFill: { position: "absolute", left: 6, bottom: -14, width: 0, height: 0, borderTopWidth: 17, borderRightWidth: 21, borderTopColor: ivory, borderRightColor: "transparent" },
  stroke: { position: "absolute", width: 7, height: 36, backgroundColor: navy },
});
