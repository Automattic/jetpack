// packages/components/src/navigator/navigator-screen/use-screen-animate-presence.ts
import { useState, useEffect, useLayoutEffect, useCallback } from "@wordpress/element";
import { useReducedMotion } from "@wordpress/compose";
import { isRTL as isRTLFn } from "@wordpress/i18n";
import * as styles from "../styles.mjs";
var ANIMATION_TIMEOUT_MARGIN = 1.2;
var isEnterAnimation = (animationDirection, animationStatus, animationName) => animationStatus === "ANIMATING_IN" && animationName === styles.ANIMATION_END_NAMES[animationDirection].in;
var isExitAnimation = (animationDirection, animationStatus, animationName) => animationStatus === "ANIMATING_OUT" && animationName === styles.ANIMATION_END_NAMES[animationDirection].out;
function useScreenAnimatePresence({
  isMatch,
  skipAnimation,
  isBack,
  onAnimationEnd
}) {
  const isRTL = isRTLFn();
  const prefersReducedMotion = useReducedMotion();
  const [animationStatus, setAnimationStatus] = useState("INITIAL");
  const becameSelected = animationStatus !== "ANIMATING_IN" && animationStatus !== "IN" && isMatch;
  const becameUnselected = animationStatus !== "ANIMATING_OUT" && animationStatus !== "OUT" && !isMatch;
  useLayoutEffect(() => {
    if (becameSelected) {
      setAnimationStatus(skipAnimation || prefersReducedMotion ? "IN" : "ANIMATING_IN");
    } else if (becameUnselected) {
      setAnimationStatus(skipAnimation || prefersReducedMotion ? "OUT" : "ANIMATING_OUT");
    }
  }, [becameSelected, becameUnselected, skipAnimation, prefersReducedMotion]);
  const animationDirection = isRTL && isBack || !isRTL && !isBack ? "end" : "start";
  const isAnimatingIn = animationStatus === "ANIMATING_IN";
  const isAnimatingOut = animationStatus === "ANIMATING_OUT";
  let animationType;
  if (isAnimatingIn) {
    animationType = "in";
  } else if (isAnimatingOut) {
    animationType = "out";
  }
  const onScreenAnimationEnd = useCallback((e) => {
    onAnimationEnd?.(e);
    if (isExitAnimation(animationDirection, animationStatus, e.animationName)) {
      setAnimationStatus("OUT");
    } else if (isEnterAnimation(animationDirection, animationStatus, e.animationName)) {
      setAnimationStatus("IN");
    }
  }, [onAnimationEnd, animationStatus, animationDirection]);
  useEffect(() => {
    let animationTimeout;
    if (isAnimatingOut) {
      animationTimeout = window.setTimeout(() => {
        setAnimationStatus("OUT");
        animationTimeout = void 0;
      }, styles.TOTAL_ANIMATION_DURATION.OUT * ANIMATION_TIMEOUT_MARGIN);
    } else if (isAnimatingIn) {
      animationTimeout = window.setTimeout(() => {
        setAnimationStatus("IN");
        animationTimeout = void 0;
      }, styles.TOTAL_ANIMATION_DURATION.IN * ANIMATION_TIMEOUT_MARGIN);
    }
    return () => {
      if (animationTimeout) {
        window.clearTimeout(animationTimeout);
        animationTimeout = void 0;
      }
    };
  }, [isAnimatingOut, isAnimatingIn]);
  return {
    animationStyles: styles.navigatorScreenAnimation,
    // Render the screen's contents in the DOM not only when the screen is
    // selected, but also while it is animating out.
    shouldRenderScreen: isMatch || animationStatus === "IN" || animationStatus === "ANIMATING_OUT",
    screenProps: {
      onAnimationEnd: onScreenAnimationEnd,
      "data-animation-direction": animationDirection,
      "data-animation-type": animationType,
      "data-skip-animation": skipAnimation || void 0
    }
  };
}
export {
  useScreenAnimatePresence
};
//# sourceMappingURL=use-screen-animate-presence.mjs.map
