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

// packages/rich-text/src/toggle-format.js
var toggle_format_exports = {};
__export(toggle_format_exports, {
  toggleFormat: () => toggleFormat
});
module.exports = __toCommonJS(toggle_format_exports);
var import_a11y = require("@wordpress/a11y");
var import_i18n = require("@wordpress/i18n");
var import_get_active_format = require("./get-active-format.cjs");
var import_remove_format = require("./remove-format.cjs");
var import_apply_format = require("./apply-format.cjs");
function toggleFormat(value, format) {
  if ((0, import_get_active_format.getActiveFormat)(value, format.type)) {
    if (format.title) {
      (0, import_a11y.speak)((0, import_i18n.sprintf)((0, import_i18n.__)("%s removed."), format.title), "assertive");
    }
    return (0, import_remove_format.removeFormat)(value, format.type);
  }
  if (format.title) {
    (0, import_a11y.speak)((0, import_i18n.sprintf)((0, import_i18n.__)("%s applied."), format.title), "assertive");
  }
  return (0, import_apply_format.applyFormat)(value, format);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  toggleFormat
});
//# sourceMappingURL=toggle-format.cjs.map
