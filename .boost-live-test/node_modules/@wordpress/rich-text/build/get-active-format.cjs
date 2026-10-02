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

// packages/rich-text/src/get-active-format.js
var get_active_format_exports = {};
__export(get_active_format_exports, {
  getActiveFormat: () => getActiveFormat
});
module.exports = __toCommonJS(get_active_format_exports);
var import_get_active_formats = require("./get-active-formats.cjs");
function getActiveFormat(value, formatType) {
  return (0, import_get_active_formats.getActiveFormats)(value).find(
    ({ type }) => type === formatType
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getActiveFormat
});
//# sourceMappingURL=get-active-format.cjs.map
