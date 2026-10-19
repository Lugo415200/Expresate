export type ReleaseStatus = "available" | "coming-soon" | "locked";
declare const course: {
  beta: { billing: boolean; secondaryLearning: boolean };
  release: {
    status(value: string | { id: string }): ReleaseStatus;
    isAvailable(value: string | { id: string }): boolean;
  };
};
export default course;
