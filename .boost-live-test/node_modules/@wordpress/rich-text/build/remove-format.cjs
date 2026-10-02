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

// packages/rich-text/src/remove-format.js
var remove_format_exports = {};
__export(remove_format_exports, {
  removeFormat: () => removeFormat
});
module.exports = __toCommonJS(remove_format_exports);
var import_normalise_formats = require("./normalise-formats.cjs");
function removeFormat(value, formatType, startIndex = value.start, endIndex = value.end) {
  const { formats, activeFormats } = value;
  const newFormats = formats.slice();
  if (startIndex === endIndex) {
    const format = newFormats[startIndex]?.find(
      ({ type }) => type === formatType
    );
    if (format) {
      while (newFormats[startIndex]?.find(
        (newFormat) => newFormat === format
      )) {
        filterFormats(newFormats, startIndex, formatType);
        startIndex--;
      }
      endIndex++;
      while (newFormats[endIndex]?.find(
        (newFormat) => newFormat === format
      )) {
        filterFormats(newFormats, endIndex, formatType);
        endIndex++;
      }
    }
  } else {
    for (let i = startIndex; i < endIndex; i++) {
      if (newFormats[i]) {
        filterFormats(newFormats, i, formatType);
      }
    }
  }
  return (0, import_normalise_formats.normaliseFormats)({
    ...value,
    formats: newFormats,
    activeFormats: activeFormats?.filter(({ type }) => type !== formatType) || []
  });
}
function filterFormats(formats, index, formatType) {
  const newFormats = formats[index].filter(
    ({ type }) => type !== formatType
  );
  if (newFormats.length) {
    formats[index] = newFormats;
  } else {
    delete formats[index];
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  removeFormat
});
//# sourceMappingURL=remove-format.cjs.map
