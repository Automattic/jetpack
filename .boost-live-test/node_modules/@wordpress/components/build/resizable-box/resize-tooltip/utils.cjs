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

// packages/components/src/resizable-box/resize-tooltip/utils.ts
var utils_exports = {};
__export(utils_exports, {
  POSITIONS: () => POSITIONS,
  useResizeLabel: () => useResizeLabel
});
module.exports = __toCommonJS(utils_exports);
var import_element = require("@wordpress/element");
var import_compose = require("@wordpress/compose");
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
  const [resizeListener, sizes] = (0, import_compose.useResizeObserver)();
  const isAxisControlled = !!axis;
  const [moveX, setMoveX] = (0, import_element.useState)(false);
  const [moveY, setMoveY] = (0, import_element.useState)(false);
  const {
    width,
    height
  } = sizes;
  const heightRef = (0, import_element.useRef)(height);
  const widthRef = (0, import_element.useRef)(width);
  const moveTimeoutRef = (0, import_element.useRef)(void 0);
  const debounceUnsetMoveXY = (0, import_element.useCallback)(() => {
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
  (0, import_element.useEffect)(() => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  POSITIONS,
  useResizeLabel
});
//# sourceMappingURL=utils.cjs.map
