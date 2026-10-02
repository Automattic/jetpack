// packages/components/src/popover/utils.ts
import { cubicBezier } from "framer-motion";
import { DROPDOWN_MOTION } from "../utils/index.mjs";
var POSITION_TO_PLACEMENT = {
  bottom: "bottom",
  top: "top",
  "middle left": "left",
  "middle right": "right",
  "bottom left": "bottom-end",
  "bottom center": "bottom",
  "bottom right": "bottom-start",
  "top left": "top-end",
  "top center": "top",
  "top right": "top-start",
  "middle left left": "left",
  "middle left right": "left",
  "middle left bottom": "left-end",
  "middle left top": "left-start",
  "middle right left": "right",
  "middle right right": "right",
  "middle right bottom": "right-end",
  "middle right top": "right-start",
  "bottom left left": "bottom-end",
  "bottom left right": "bottom-end",
  "bottom left bottom": "bottom-end",
  "bottom left top": "bottom-end",
  "bottom center left": "bottom",
  "bottom center right": "bottom",
  "bottom center bottom": "bottom",
  "bottom center top": "bottom",
  "bottom right left": "bottom-start",
  "bottom right right": "bottom-start",
  "bottom right bottom": "bottom-start",
  "bottom right top": "bottom-start",
  "top left left": "top-end",
  "top left right": "top-end",
  "top left bottom": "top-end",
  "top left top": "top-end",
  "top center left": "top",
  "top center right": "top",
  "top center bottom": "top",
  "top center top": "top",
  "top right left": "top-start",
  "top right right": "top-start",
  "top right bottom": "top-start",
  "top right top": "top-start",
  // `middle`/`middle center [corner?]` positions are associated to a fallback
  // `bottom` placement because there aren't any corresponding placement values.
  middle: "bottom",
  "middle center": "bottom",
  "middle center bottom": "bottom",
  "middle center left": "bottom",
  "middle center right": "bottom",
  "middle center top": "bottom"
};
var positionToPlacement = (position) => POSITION_TO_PLACEMENT[position] ?? "bottom";
var PLACEMENT_TO_ANIMATION_ORIGIN = {
  top: {
    originX: 0.5,
    originY: 1
  },
  // open from bottom, center
  "top-start": {
    originX: 0,
    originY: 1
  },
  // open from bottom, left
  "top-end": {
    originX: 1,
    originY: 1
  },
  // open from bottom, right
  right: {
    originX: 0,
    originY: 0.5
  },
  // open from middle, left
  "right-start": {
    originX: 0,
    originY: 0
  },
  // open from top, left
  "right-end": {
    originX: 0,
    originY: 1
  },
  // open from bottom, left
  bottom: {
    originX: 0.5,
    originY: 0
  },
  // open from top, center
  "bottom-start": {
    originX: 0,
    originY: 0
  },
  // open from top, left
  "bottom-end": {
    originX: 1,
    originY: 0
  },
  // open from top, right
  left: {
    originX: 1,
    originY: 0.5
  },
  // open from middle, right
  "left-start": {
    originX: 1,
    originY: 0
  },
  // open from top, right
  "left-end": {
    originX: 1,
    originY: 1
  },
  // open from bottom, right
  overlay: {
    originX: 0.5,
    originY: 0.5
  }
  // open from center, center
};
var placementToMotionAnimationProps = (placement) => {
  const translateProp = placement.startsWith("top") || placement.startsWith("bottom") ? "translateY" : "translateX";
  const translateDirection = placement.startsWith("top") || placement.startsWith("left") ? 1 : -1;
  return {
    style: PLACEMENT_TO_ANIMATION_ORIGIN[placement],
    initial: {
      opacity: 0,
      [translateProp]: `${DROPDOWN_MOTION.SLIDE_DISTANCE * translateDirection}px`
    },
    animate: {
      opacity: 1,
      [translateProp]: 0
    },
    transition: {
      opacity: {
        duration: DROPDOWN_MOTION.FADE_DURATION / 1e3,
        ease: DROPDOWN_MOTION.FADE_EASING.function
      },
      [translateProp]: {
        duration: DROPDOWN_MOTION.SLIDE_DURATION / 1e3,
        ease: cubicBezier(...DROPDOWN_MOTION.SLIDE_EASING.args)
      }
    }
  };
};
function isTopBottom(anchorRef) {
  return !!anchorRef?.top;
}
function isRef(anchorRef) {
  return !!anchorRef?.current;
}
var getReferenceElement = ({
  anchor,
  anchorRef,
  anchorRect,
  getAnchorRect,
  fallbackReferenceElement
}) => {
  let referenceElement = null;
  if (anchor) {
    referenceElement = anchor;
  } else if (isTopBottom(anchorRef)) {
    referenceElement = {
      getBoundingClientRect() {
        const topRect = anchorRef.top.getBoundingClientRect();
        const bottomRect = anchorRef.bottom.getBoundingClientRect();
        return new window.DOMRect(topRect.x, topRect.y, topRect.width, bottomRect.bottom - topRect.top);
      }
    };
  } else if (isRef(anchorRef)) {
    referenceElement = anchorRef.current;
  } else if (anchorRef) {
    referenceElement = anchorRef;
  } else if (anchorRect) {
    referenceElement = {
      getBoundingClientRect() {
        return anchorRect;
      }
    };
  } else if (getAnchorRect) {
    referenceElement = {
      getBoundingClientRect() {
        const rect = getAnchorRect(fallbackReferenceElement);
        return new window.DOMRect(rect.x ?? rect.left, rect.y ?? rect.top, rect.width ?? rect.right - rect.left, rect.height ?? rect.bottom - rect.top);
      }
    };
  } else if (fallbackReferenceElement) {
    referenceElement = fallbackReferenceElement.parentElement;
  }
  return referenceElement ?? null;
};
var computePopoverPosition = (c) => c === null || Number.isNaN(c) ? void 0 : Math.round(c);
export {
  computePopoverPosition,
  getReferenceElement,
  placementToMotionAnimationProps,
  positionToPlacement
};
//# sourceMappingURL=utils.mjs.map
