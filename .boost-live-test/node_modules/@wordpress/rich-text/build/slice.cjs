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

// packages/rich-text/src/slice.js
var slice_exports = {};
__export(slice_exports, {
  slice: () => slice
});
module.exports = __toCommonJS(slice_exports);
function slice(value, startIndex = value.start, endIndex = value.end) {
  const { formats, replacements, text } = value;
  if (startIndex === void 0 || endIndex === void 0) {
    return { ...value };
  }
  return {
    formats: formats.slice(startIndex, endIndex),
    replacements: replacements.slice(startIndex, endIndex),
    text: text.slice(startIndex, endIndex)
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  slice
});
//# sourceMappingURL=slice.cjs.map
