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

// packages/rich-text/src/get-active-formats.js
var get_active_formats_exports = {};
__export(get_active_formats_exports, {
  getActiveFormats: () => getActiveFormats
});
module.exports = __toCommonJS(get_active_formats_exports);
var import_is_format_equal = require("./is-format-equal.cjs");
function getActiveFormats(value, EMPTY_ACTIVE_FORMATS = []) {
  const { formats, start, end, activeFormats } = value;
  if (start === void 0) {
    return EMPTY_ACTIVE_FORMATS;
  }
  if (start === end) {
    if (activeFormats) {
      return activeFormats;
    }
    const formatsBefore = formats[start - 1] || EMPTY_ACTIVE_FORMATS;
    const formatsAfter = formats[start] || EMPTY_ACTIVE_FORMATS;
    if (formatsBefore.length < formatsAfter.length) {
      return formatsBefore;
    }
    return formatsAfter;
  }
  if (!formats[start]) {
    return EMPTY_ACTIVE_FORMATS;
  }
  const selectedFormats = formats.slice(start, end);
  const _activeFormats = [...selectedFormats[0]];
  let i = selectedFormats.length;
  while (i--) {
    const formatsAtIndex = selectedFormats[i];
    if (!formatsAtIndex) {
      return EMPTY_ACTIVE_FORMATS;
    }
    let ii = _activeFormats.length;
    while (ii--) {
      const format = _activeFormats[ii];
      if (!formatsAtIndex.find(
        (_format) => (0, import_is_format_equal.isFormatEqual)(format, _format)
      )) {
        _activeFormats.splice(ii, 1);
      }
    }
    if (_activeFormats.length === 0) {
      return EMPTY_ACTIVE_FORMATS;
    }
  }
  return _activeFormats || EMPTY_ACTIVE_FORMATS;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getActiveFormats
});
//# sourceMappingURL=get-active-formats.cjs.map
