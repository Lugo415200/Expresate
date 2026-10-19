// @refresh reset
// Artwork reviews should restart on the newest concept after Fast Refresh.
import React, { useState } from "react";
import { Modal, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { lesson000 } from "../../../../shared/lesson000-flow";
import { ImmersiveScene } from "../ImmersiveScene";

const classroom = require("../../../../assets/backgrounds/classroom/classroom-day.webp");
const original = require("../../../../assets/characters/sofia/greeting.webp");
const conceptV1 = require("../../assets/concepts/sofia-pixel-v1.png");
const conceptV2 = require("../../assets/concepts/sofia-pixel-v2.png");

const versions = [
  { id: "v1", source: conceptV1, label: "Sofía · pixel art V1", heading: "SOFÍA PIXEL ART · V1 · DEV", counter: "PIXEL V1", next: "Ver V2 →", ratio: 2 / 3, grid: { width: 64, height: 96 } },
  { id: "v2", source: conceptV2, label: "Sofía · pixel art V2", heading: "SOFÍA PIXEL ART · V2 · DEV", counter: "PIXEL V2", next: "Ver original →", ratio: 2 / 3, grid: { width: 128, height: 192, minimumScale: 0.5 } },
  { id: "original", source: original, label: "Sofía · ilustración actual", heading: "SOFÍA ORIGINAL · DEV", counter: "ORIGINAL", next: "Ver V1 →", ratio: 351 / 536, grid: undefined },
];

/** Local artwork review only: no lesson mounting, storage, progress or audio. */
export function SofiaConceptPreview({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(1);
  const version = versions[index];
  const opening = lesson000.blocks[0];
  if (!__DEV__ || opening.type !== "dialogue") return null;
  const greeting = opening.lines[0];
  return <Modal visible animationType="none" presentationStyle="fullScreen" onRequestClose={onClose}>
    <StatusBar style="light" />
    <View testID="sofia-concept-preview" style={{ flex: 1 }}>
      <ImmersiveScene
        appearance="welcome"
        showBackground
        background={classroom}
        character={version.source}
        characterLabel={version.label}
        characterAspectRatio={version.ratio}
        characterPixelGrid={version.grid}
        stationaryCharacter
        instantDialogue
        locationLabel={version.heading}
        speaker={greeting.speaker}
        text={greeting.text}
        progress={1}
        counterText={version.counter}
        nextLabel={version.next}
        sceneKey={`sofia-concept-${version.id}`}
        typewriterSound={{ enabled: false }}
        onAdvance={() => setIndex(value => (value + 1) % versions.length)}
        onExit={onClose}
      />
    </View>
  </Modal>;
}
