/** Incremental renderer contract. Existing HTML lessons are retained. */
export type LearningBlock =
  | { id: string; type: "instruction"; title: string; text: string }
  | {
      id: string;
      type: "dialogue";
      title: string;
      lines: { speaker: string; text: string }[];
    }
  | { id: string; type: "alphabet"; title: string }
  | {
      id: string;
      type: "choice";
      title: string;
      audio: string[];
      choices: string[];
      answer: string;
    }
  | {
      id: string;
      type: "spelling";
      title: string;
      audio: string[];
      choices: string[];
      hidden?: boolean;
    }
  | { id: string; type: "speech"; title: string; text: string }
  | { id: string; type: "completion"; title: string };
export type LearningLesson = {
  id: string;
  title: string;
  xpReward: number;
  blocks: LearningBlock[];
};
