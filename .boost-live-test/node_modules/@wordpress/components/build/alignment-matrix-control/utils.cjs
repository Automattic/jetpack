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

// packages/components/src/alignment-matrix-control/utils.tsx
var utils_exports = {};
__export(utils_exports, {
  ALIGNMENTS: () => ALIGNMENTS,
  ALIGNMENT_LABEL: () => ALIGNMENT_LABEL,
  GRID: () => GRID,
  getAlignmentIndex: () => getAlignmentIndex,
  getItemId: () => getItemId,
  getItemValue: () => getItemValue
});
module.exports = __toCommonJS(utils_exports);
var import_i18n = require("@wordpress/i18n");
var GRID = [["top left", "top center", "top right"], ["center left", "center center", "center right"], ["bottom left", "bottom center", "bottom right"]];
var ALIGNMENT_LABEL = {
  "top left": (0, import_i18n.__)("Top Left"),
  "top center": (0, import_i18n.__)("Top Center"),
  "top right": (0, import_i18n.__)("Top Right"),
  "center left": (0, import_i18n.__)("Center Left"),
  "center center": (0, import_i18n.__)("Center"),
  center: (0, import_i18n.__)("Center"),
  "center right": (0, import_i18n.__)("Center Right"),
  "bottom left": (0, import_i18n.__)("Bottom Left"),
  "bottom center": (0, import_i18n.__)("Bottom Center"),
  "bottom right": (0, import_i18n.__)("Bottom Right")
};
var ALIGNMENTS = GRID.flat();
function normalize(value) {
  const normalized = value === "center" ? "center center" : value;
  const transformed = normalized?.replace("-", " ");
  return ALIGNMENTS.includes(transformed) ? transformed : void 0;
}
function getItemId(prefixId, value) {
  const normalized = normalize(value);
  if (!normalized) {
    return;
  }
  const id = normalized.replace(" ", "-");
  return `${prefixId}-${id}`;
}
function getItemValue(prefixId, id) {
  const value = id?.replace(prefixId + "-", "");
  return normalize(value);
}
function getAlignmentIndex(alignment = "center") {
  const normalized = normalize(alignment);
  if (!normalized) {
    return void 0;
  }
  const index = ALIGNMENTS.indexOf(normalized);
  return index > -1 ? index : void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ALIGNMENTS,
  ALIGNMENT_LABEL,
  GRID,
  getAlignmentIndex,
  getItemId,
  getItemValue
});
//# sourceMappingURL=utils.cjs.map
