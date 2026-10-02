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

// packages/components/src/custom-gradient-picker/gradient-bar/constants.ts
var constants_exports = {};
__export(constants_exports, {
  GRADIENT_MARKERS_WIDTH: () => GRADIENT_MARKERS_WIDTH,
  INSERT_POINT_WIDTH: () => INSERT_POINT_WIDTH,
  KEYBOARD_CONTROL_POINT_VARIATION: () => KEYBOARD_CONTROL_POINT_VARIATION,
  MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_MARKER: () => MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_MARKER,
  MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT: () => MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT,
  MINIMUM_DISTANCE_BETWEEN_POINTS: () => MINIMUM_DISTANCE_BETWEEN_POINTS,
  MINIMUM_SIGNIFICANT_MOVE: () => MINIMUM_SIGNIFICANT_MOVE
});
module.exports = __toCommonJS(constants_exports);
var GRADIENT_MARKERS_WIDTH = 16;
var INSERT_POINT_WIDTH = 16;
var MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT = 10;
var MINIMUM_DISTANCE_BETWEEN_POINTS = 0;
var MINIMUM_SIGNIFICANT_MOVE = 5;
var KEYBOARD_CONTROL_POINT_VARIATION = MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT;
var MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_MARKER = (INSERT_POINT_WIDTH + GRADIENT_MARKERS_WIDTH) / 2;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GRADIENT_MARKERS_WIDTH,
  INSERT_POINT_WIDTH,
  KEYBOARD_CONTROL_POINT_VARIATION,
  MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_MARKER,
  MINIMUM_DISTANCE_BETWEEN_INSERTER_AND_POINT,
  MINIMUM_DISTANCE_BETWEEN_POINTS,
  MINIMUM_SIGNIFICANT_MOVE
});
//# sourceMappingURL=constants.cjs.map
