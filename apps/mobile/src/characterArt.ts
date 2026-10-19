import { ImageStyle, Platform } from "react-native";

// Approved native cast. Original illustration files remain untouched for rollback.
export const characterArt = {
  sofia: require("../assets/concepts/sofia-pixel-v2.png"),
  professor: require("../assets/characters/professor-pixel-v2.png"),
};

export const characterGrid = { width: 64, height: 96 };
export const characterAspectRatio = 2 / 3;
export const pixelImageStyle: ImageStyle & { imageRendering?: "pixelated" } =
  Platform.OS === "web" ? { imageRendering: "pixelated" } : {};
