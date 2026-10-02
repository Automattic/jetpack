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

// packages/rich-text/src/apply-format.js
var apply_format_exports = {};
__export(apply_format_exports, {
  applyFormat: () => applyFormat
});
module.exports = __toCommonJS(apply_format_exports);
var import_normalise_formats = require("./normalise-formats.cjs");
function replace(array, index, value) {
  array = array.slice();
  array[index] = value;
  return array;
}
function applyFormat(value, format, startIndex = value.start, endIndex = value.end) {
  const { formats, activeFormats } = value;
  const newFormats = formats.slice();
  if (startIndex === endIndex) {
    const startFormat = newFormats[startIndex]?.find(
      ({ type }) => type === format.type
    );
    if (startFormat) {
      const index = newFormats[startIndex].indexOf(startFormat);
      while (newFormats[startIndex] && newFormats[startIndex][index] === startFormat) {
        newFormats[startIndex] = replace(
          newFormats[startIndex],
          index,
          format
        );
        startIndex--;
      }
      endIndex++;
      while (newFormats[endIndex] && newFormats[endIndex][index] === startFormat) {
        newFormats[endIndex] = replace(
          newFormats[endIndex],
          index,
          format
        );
        endIndex++;
      }
    }
  } else {
    let position = Infinity;
    for (let index = startIndex; index < endIndex; index++) {
      if (newFormats[index]) {
        newFormats[index] = newFormats[index].filter(
          ({ type }) => type !== format.type
        );
        const length = newFormats[index].length;
        if (length < position) {
          position = length;
        }
      } else {
        newFormats[index] = [];
        position = 0;
      }
    }
    for (let index = startIndex; index < endIndex; index++) {
      newFormats[index].splice(position, 0, format);
    }
  }
  return (0, import_normalise_formats.normaliseFormats)({
    ...value,
    formats: newFormats,
    // Always revise active formats. This serves as a placeholder for new
    // inputs with the format so new input appears with the format applied,
    // and ensures a format of the same type uses the latest values.
    activeFormats: [
      ...activeFormats?.filter(
        ({ type }) => type !== format.type
      ) || [],
      format
    ]
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyFormat
});
//# sourceMappingURL=apply-format.cjs.map
