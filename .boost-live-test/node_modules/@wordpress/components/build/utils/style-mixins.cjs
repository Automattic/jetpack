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

// packages/components/src/utils/style-mixins.js
var style_mixins_exports = {};
__export(style_mixins_exports, {
  COLORS: () => import_colors_values.COLORS,
  CONFIG: () => import_config_values.default,
  DROPDOWN_MOTION: () => import_dropdown_motion.DROPDOWN_MOTION,
  DROPDOWN_MOTION_CSS: () => import_dropdown_motion.DROPDOWN_MOTION_CSS,
  baseLabelTypography: () => import_base_label.baseLabelTypography,
  boxSizingReset: () => import_box_sizing.boxSizingReset,
  breakpoint: () => import_breakpoint.breakpoint,
  font: () => import_font.font,
  rgba: () => import_colors.rgba,
  rtl: () => import_rtl.rtl
});
module.exports = __toCommonJS(style_mixins_exports);
var import_box_sizing = require("./box-sizing.cjs");
var import_colors = require("./colors.cjs");
var import_rtl = require("./rtl.cjs");
var import_font = require("./font.cjs");
var import_breakpoint = require("./breakpoint.cjs");
var import_config_values = __toESM(require("./config-values.cjs"));
var import_colors_values = require("./colors-values.cjs");
var import_base_label = require("./base-label.cjs");
var import_dropdown_motion = require("./dropdown-motion.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  COLORS,
  CONFIG,
  DROPDOWN_MOTION,
  DROPDOWN_MOTION_CSS,
  baseLabelTypography,
  boxSizingReset,
  breakpoint,
  font,
  rgba,
  rtl
});
//# sourceMappingURL=style-mixins.cjs.map
