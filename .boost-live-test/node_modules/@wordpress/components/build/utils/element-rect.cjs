"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/utils/element-rect.ts
var element_rect_exports = {};
__export(element_rect_exports, {
  NULL_ELEMENT_OFFSET_RECT: () => NULL_ELEMENT_OFFSET_RECT,
  getElementOffsetRect: () => getElementOffsetRect,
  useTrackElementOffsetRect: () => useTrackElementOffsetRect
});
module.exports = __toCommonJS(element_rect_exports);
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
var NULL_ELEMENT_OFFSET_RECT = {
  element: void 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  width: 0,
  height: 0
};
function getElementOffsetRect(element) {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return;
  }
  const offsetParent = element.offsetParent;
  const offsetParentRect = offsetParent?.getBoundingClientRect() ?? NULL_ELEMENT_OFFSET_RECT;
  const offsetParentScrollX = offsetParent?.scrollLeft ?? 0;
  const offsetParentScrollY = offsetParent?.scrollTop ?? 0;
  const computedWidth = parseFloat(getComputedStyle(element).width);
  const computedHeight = parseFloat(getComputedStyle(element).height);
  const scaleX = computedWidth / rect.width;
  const scaleY = computedHeight / rect.height;
  return {
    element,
    // To obtain the adjusted values for the position:
    // 1. Compute the element's position relative to the offset parent.
    // 2. Correct for the scale factor.
    // 3. Adjust for the scroll position of the offset parent.
    top: (rect.top - offsetParentRect?.top) * scaleY + offsetParentScrollY,
    right: (offsetParentRect?.right - rect.right) * scaleX - offsetParentScrollX,
    bottom: (offsetParentRect?.bottom - rect.bottom) * scaleY - offsetParentScrollY,
    left: (rect.left - offsetParentRect?.left) * scaleX + offsetParentScrollX,
    // Computed dimensions don't need any adjustments.
    width: computedWidth,
    height: computedHeight
  };
}
var POLL_RATE = 100;
function useTrackElementOffsetRect(targetElement, deps = []) {
  const [indicatorPosition, setIndicatorPosition] = (0, import_element.useState)(NULL_ELEMENT_OFFSET_RECT);
  const intervalRef = (0, import_element.useRef)(void 0);
  const measure = (0, import_compose.useEvent)(() => {
    if (targetElement && targetElement.isConnected) {
      const elementOffsetRect = getElementOffsetRect(targetElement);
      if (elementOffsetRect) {
        setIndicatorPosition(elementOffsetRect);
        clearInterval(intervalRef.current);
        return true;
      }
    } else {
      clearInterval(intervalRef.current);
    }
    return false;
  });
  const setElement = (0, import_compose.useResizeObserver)(() => {
    if (!measure()) {
      requestAnimationFrame(() => {
        if (!measure()) {
          intervalRef.current = setInterval(measure, POLL_RATE);
        }
      });
    }
  });
  (0, import_element.useLayoutEffect)(() => {
    setElement(targetElement);
    if (!targetElement) {
      setIndicatorPosition(NULL_ELEMENT_OFFSET_RECT);
    }
  }, [setElement, targetElement]);
  (0, import_element.useLayoutEffect)(() => {
    measure();
  }, deps);
  return indicatorPosition;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NULL_ELEMENT_OFFSET_RECT,
  getElementOffsetRect,
  useTrackElementOffsetRect
});
//# sourceMappingURL=element-rect.cjs.map
