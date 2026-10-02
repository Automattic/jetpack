// packages/components/src/utils/element-rect.ts
import { useLayoutEffect, useRef, useState } from "@wordpress/element";
import { useEvent, useResizeObserver } from "@wordpress/compose";
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
  const [indicatorPosition, setIndicatorPosition] = useState(NULL_ELEMENT_OFFSET_RECT);
  const intervalRef = useRef(void 0);
  const measure = useEvent(() => {
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
  const setElement = useResizeObserver(() => {
    if (!measure()) {
      requestAnimationFrame(() => {
        if (!measure()) {
          intervalRef.current = setInterval(measure, POLL_RATE);
        }
      });
    }
  });
  useLayoutEffect(() => {
    setElement(targetElement);
    if (!targetElement) {
      setIndicatorPosition(NULL_ELEMENT_OFFSET_RECT);
    }
  }, [setElement, targetElement]);
  useLayoutEffect(() => {
    measure();
  }, deps);
  return indicatorPosition;
}
export {
  NULL_ELEMENT_OFFSET_RECT,
  getElementOffsetRect,
  useTrackElementOffsetRect
};
//# sourceMappingURL=element-rect.mjs.map
