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

// packages/components/src/font-size-picker/constants.ts
var constants_exports = {};
__export(constants_exports, {
  T_SHIRT_ABBREVIATIONS: () => T_SHIRT_ABBREVIATIONS,
  T_SHIRT_NAMES: () => T_SHIRT_NAMES
});
module.exports = __toCommonJS(constants_exports);
var import_i18n = require("@wordpress/i18n");
var T_SHIRT_ABBREVIATIONS = [
  /* translators: S stands for 'small' and is a size label. */
  (0, import_i18n.__)("S"),
  /* translators: M stands for 'medium' and is a size label. */
  (0, import_i18n.__)("M"),
  /* translators: L stands for 'large' and is a size label. */
  (0, import_i18n.__)("L"),
  /* translators: XL stands for 'extra large' and is a size label. */
  (0, import_i18n.__)("XL"),
  /* translators: XXL stands for 'extra extra large' and is a size label. */
  (0, import_i18n.__)("XXL")
];
var T_SHIRT_NAMES = [(0, import_i18n.__)("Small"), (0, import_i18n.__)("Medium"), (0, import_i18n.__)("Large"), (0, import_i18n.__)("Extra Large"), (0, import_i18n.__)("Extra Extra Large")];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  T_SHIRT_ABBREVIATIONS,
  T_SHIRT_NAMES
});
//# sourceMappingURL=constants.cjs.map
