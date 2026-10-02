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

// packages/components/src/alignment-matrix-control/icon.tsx
var icon_exports = {};
__export(icon_exports, {
  default: () => icon_default
});
module.exports = __toCommonJS(icon_exports);
var import_clsx = __toESM(require("clsx"));
var import_primitives = require("@wordpress/primitives");
var import_utils = require("./utils.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_primitives.SVG, {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: `0 0 ${BASE_SIZE} ${BASE_SIZE}`,
    width: size ?? width ?? BASE_SIZE,
    height: size ?? height ?? BASE_SIZE,
    role: "presentation",
    className: (0, import_clsx.default)("component-alignment-matrix-control-icon", className),
    style: {
      pointerEvents: disablePointerEvents ? "none" : void 0,
      ...style
    },
    ...props,
    children: import_utils.ALIGNMENTS.map((align, index) => {
      const dotSize = (0, import_utils.getAlignmentIndex)(value) === index ? DOT_SIZE_SELECTED : DOT_SIZE;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_primitives.Rect, {
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
//# sourceMappingURL=icon.cjs.map
