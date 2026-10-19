import React from "react";
import { ImmersiveScene, SceneEvent } from "./ImmersiveScene";
import { characterArt, characterAspectRatio, characterGrid } from "./characterArt";

type DialogueLine = {
  speaker: string;
  text: string;
};

const classroom = require("../../../assets/backgrounds/classroom/classroom-day.webp");

export function StoryScene({
  sceneId,
  line,
  lineIndex,
  lineCount,
  onNext,
  onContinue,
  onExit,
  onSceneEvent,
}: {
  sceneId: string;
  line: DialogueLine;
  lineIndex: number;
  lineCount: number;
  onNext: () => void;
  onContinue: () => void;
  onExit: () => void;
  onSceneEvent?: (event: SceneEvent) => void;
}) {
  const isProfessor = line.speaker.toLowerCase().includes("prof");
  const isLast = lineIndex === lineCount - 1;

  return (
    <ImmersiveScene
      appearance={sceneId === "welcome" ? "welcome" : "classroom"}
      showBackground
      background={classroom}
      character={isProfessor ? characterArt.professor : characterArt.sofia}
      characterLabel={line.speaker}
      characterSide={isProfessor ? "right" : "left"}
      characterAspectRatio={characterAspectRatio}
      characterPixelGrid={characterGrid}
      stationaryCharacter
      locationLabel="AULA DE INGLÉS"
      speaker={line.speaker}
      text={line.text}
      progress={(lineIndex + 1) / lineCount}
      counterText={`${lineIndex + 1} / ${lineCount}`}
      nextLabel={isLast ? "Continuar →" : "Siguiente →"}
      sceneKey={`${sceneId}-${lineIndex}-${line.speaker}`}
      onAdvance={isLast ? onContinue : onNext}
      onExit={onExit}
      onSceneEvent={onSceneEvent}
    />
  );
}
