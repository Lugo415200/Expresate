import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Fail closed until the OS preference is known; subscribe to changes while open. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => {
      receivedEvent = true;
      if (active) setReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active && !receivedEvent) setReduced(value);
    }).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}
