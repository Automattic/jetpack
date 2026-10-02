"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/navigator/navigator-screen/use-screen-animate-presence.ts
var use_screen_animate_presence_exports = {};
__export(use_screen_animate_presence_exports, {
  useScreenAnimatePresence: () => useScreenAnimatePresence
});
module.exports = __toCommonJS(use_screen_animate_presence_exports);
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var import_i18n = require("@wordpress/i18n");
var styles = __toESM(require("../styles.cjs"));
var ANIMATION_TIMEOUT_MARGIN = 1.2;
var isEnterAnimation = (animationDirection, animationStatus, animationName) => animationStatus === "ANIMATING_IN" && animationName === styles.ANIMATION_END_NAMES[animationDirection].in;
var isExitAnimation = (animationDirection, animationStatus, animationName) => animationStatus === "ANIMATING_OUT" && animationName === styles.ANIMATION_END_NAMES[animationDirection].out;
function useScreenAnimatePresence({
  isMatch,
  skipAnimation,
  isBack,
  onAnimationEnd
}) {
  const isRTL = (0, import_i18n.isRTL)();
  const prefersReducedMotion = (0, import_compose.useReducedMotion)();
  const [animationStatus, setAnimationStatus] = (0, import_element.useState)("INITIAL");
  const becameSelected = animationStatus !== "ANIMATING_IN" && animationStatus !== "IN" && isMatch;
  const becameUnselected = animationStatus !== "ANIMATING_OUT" && animationStatus !== "OUT" && !isMatch;
  (0, import_element.useLayoutEffect)(() => {
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
  const onScreenAnimationEnd = (0, import_element.useCallback)((e) => {
    onAnimationEnd?.(e);
    if (isExitAnimation(animationDirection, animationStatus, e.animationName)) {
      setAnimationStatus("OUT");
    } else if (isEnterAnimation(animationDirection, animationStatus, e.animationName)) {
      setAnimationStatus("IN");
    }
  }, [onAnimationEnd, animationStatus, animationDirection]);
  (0, import_element.useEffect)(() => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useScreenAnimatePresence
});
//# sourceMappingURL=use-screen-animate-presence.cjs.map
