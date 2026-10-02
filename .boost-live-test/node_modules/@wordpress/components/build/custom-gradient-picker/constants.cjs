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

// packages/components/src/custom-gradient-picker/constants.ts
var constants_exports = {};
__export(constants_exports, {
  DEFAULT_GRADIENT: () => DEFAULT_GRADIENT,
  DEFAULT_LINEAR_GRADIENT_ANGLE: () => DEFAULT_LINEAR_GRADIENT_ANGLE,
  DIRECTIONAL_ORIENTATION_ANGLE_MAP: () => DIRECTIONAL_ORIENTATION_ANGLE_MAP,
  GRADIENT_OPTIONS: () => GRADIENT_OPTIONS,
  HORIZONTAL_GRADIENT_ORIENTATION: () => HORIZONTAL_GRADIENT_ORIENTATION
});
module.exports = __toCommonJS(constants_exports);
var import_i18n = require("@wordpress/i18n");
var DEFAULT_GRADIENT = "linear-gradient(135deg, rgba(6, 147, 227, 1) 0%, rgb(155, 81, 224) 100%)";
var DEFAULT_LINEAR_GRADIENT_ANGLE = 180;
var HORIZONTAL_GRADIENT_ORIENTATION = {
  type: "angular",
  value: "90"
};
var GRADIENT_OPTIONS = [{
  value: "linear-gradient",
  label: (0, import_i18n.__)("Linear")
}, {
  value: "radial-gradient",
  label: (0, import_i18n.__)("Radial")
}];
var DIRECTIONAL_ORIENTATION_ANGLE_MAP = {
  top: 0,
  "top right": 45,
  "right top": 45,
  right: 90,
  "right bottom": 135,
  "bottom right": 135,
  bottom: 180,
  "bottom left": 225,
  "left bottom": 225,
  left: 270,
  "top left": 315,
  "left top": 315
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_GRADIENT,
  DEFAULT_LINEAR_GRADIENT_ANGLE,
  DIRECTIONAL_ORIENTATION_ANGLE_MAP,
  GRADIENT_OPTIONS,
  HORIZONTAL_GRADIENT_ORIENTATION
});
//# sourceMappingURL=constants.cjs.map
