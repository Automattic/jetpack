// packages/components/src/alignment-matrix-control/icon.tsx
import clsx from "clsx";
import { Rect, SVG } from "@wordpress/primitives";
import { ALIGNMENTS, getAlignmentIndex } from "./utils.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var BASE_SIZE = 24;
var GRID_CELL_SIZE = 7;
var GRID_PADDING = (BASE_SIZE - 3 * GRID_CELL_SIZE) / 2;
var DOT_SIZE = 2;
var DOT_SIZE_SELECTED = 4;
function AlignmentMatrixControlIcon({
  className,
  disablePointerEvents = true,
  size,
  width,
  height,
  style = {},
  value = "center",
  ...props
}) {
  return /* @__PURE__ */ _jsx(SVG, {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${BASE_SIZE} ${BASE_SIZE}`,
    width: size ?? width ?? BASE_SIZE,
    height: size ?? height ?? BASE_SIZE,
    role: "presentation",
    className: clsx("component-alignment-matrix-control-icon", className),
    style: {
      pointerEvents: disablePointerEvents ? "none" : void 0,
      ...style
    },
    ...props,
    children: ALIGNMENTS.map((align, index) => {
      const dotSize = getAlignmentIndex(value) === index ? DOT_SIZE_SELECTED : DOT_SIZE;
      return /* @__PURE__ */ _jsx(Rect, {
        x: GRID_PADDING + index % 3 * GRID_CELL_SIZE + (GRID_CELL_SIZE - dotSize) / 2,
        y: GRID_PADDING + Math.floor(index / 3) * GRID_CELL_SIZE + (GRID_CELL_SIZE - dotSize) / 2,
        width: dotSize,
        height: dotSize,
        fill: "currentColor"
      }, align);
    })
  });
}
var icon_default = AlignmentMatrixControlIcon;
export {
  icon_default as default
};
//# sourceMappingURL=icon.mjs.map
