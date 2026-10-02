// packages/components/src/resizable-box/resize-tooltip/utils.ts
import { useCallback, useEffect, useRef, useState } from "@wordpress/element";
import { useResizeObserver } from "@wordpress/compose";
var noop = () => {
};
var POSITIONS = {
  bottom: "bottom",
  corner: "corner"
};
function useResizeLabel({
  axis,
  fadeTimeout = 180,
  onResize = noop,
  position = POSITIONS.bottom,
  showPx = false
}) {
  const [resizeListener, sizes] = useResizeObserver();
  const isAxisControlled = !!axis;
  const [moveX, setMoveX] = useState(false);
  const [moveY, setMoveY] = useState(false);
  const {
    width,
    height
  } = sizes;
  const heightRef = useRef(height);
  const widthRef = useRef(width);
  const moveTimeoutRef = useRef(void 0);
  const debounceUnsetMoveXY = useCallback(() => {
    const unsetMoveXY = () => {
      if (isAxisControlled) {
        return;
      }
      setMoveX(false);
      setMoveY(false);
    };
    if (moveTimeoutRef.current) {
      window.clearTimeout(moveTimeoutRef.current);
    }
    moveTimeoutRef.current = window.setTimeout(unsetMoveXY, fadeTimeout);
  }, [fadeTimeout, isAxisControlled]);
  useEffect(() => {
    const isRendered = width !== null || height !== null;
    if (!isRendered) {
      return;
    }
    const didWidthChange = width !== widthRef.current;
    const didHeightChange = height !== heightRef.current;
    if (!didWidthChange && !didHeightChange) {
      return;
    }
    if (width && !widthRef.current && height && !heightRef.current) {
      widthRef.current = width;
      heightRef.current = height;
      return;
    }
    if (didWidthChange) {
      setMoveX(true);
      widthRef.current = width;
    }
    if (didHeightChange) {
      setMoveY(true);
      heightRef.current = height;
    }
    onResize({
      width,
      height
    });
    debounceUnsetMoveXY();
  }, [width, height, onResize, debounceUnsetMoveXY]);
  const label = getSizeLabel({
    axis,
    height,
    moveX,
    moveY,
    position,
    showPx,
    width
  });
  return {
    label,
    resizeListener
  };
}
function getSizeLabel({
  axis,
  height,
  moveX = false,
  moveY = false,
  position = POSITIONS.bottom,
  showPx = false,
  width
}) {
  if (!moveX && !moveY) {
    return void 0;
  }
  if (position === POSITIONS.corner) {
    return `${width} x ${height}`;
  }
  const labelUnit = showPx ? " px" : "";
  if (axis) {
    if (axis === "x" && moveX) {
      return `${width}${labelUnit}`;
    }
    if (axis === "y" && moveY) {
      return `${height}${labelUnit}`;
    }
  }
  if (moveX && moveY) {
    return `${width} x ${height}`;
  }
  if (moveX) {
    return `${width}${labelUnit}`;
  }
  if (moveY) {
    return `${height}${labelUnit}`;
  }
  return void 0;
}
export {
  POSITIONS,
  useResizeLabel
};
//# sourceMappingURL=utils.mjs.map
