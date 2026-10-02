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

// packages/rich-text/src/replace.js
var replace_exports = {};
__export(replace_exports, {
  replace: () => replace
});
module.exports = __toCommonJS(replace_exports);
var import_normalise_formats = require("./normalise-formats.cjs");
function replace({ formats, replacements, text, start, end }, pattern, replacement) {
  text = text.replace(pattern, (match, ...rest) => {
    const offset = rest[rest.length - 2];
    let newText = replacement;
    let newFormats;
    let newReplacements;
    if (typeof newText === "function") {
      newText = replacement(match, ...rest);
    }
    if (typeof newText === "object") {
      newFormats = newText.formats;
      newReplacements = newText.replacements;
      newText = newText.text;
    } else {
      newFormats = Array(newText.length);
      newReplacements = Array(newText.length);
      if (formats[offset]) {
        newFormats = newFormats.fill(formats[offset]);
      }
    }
    formats = formats.slice(0, offset).concat(newFormats, formats.slice(offset + match.length));
    replacements = replacements.slice(0, offset).concat(
      newReplacements,
      replacements.slice(offset + match.length)
    );
    if (start) {
      start = end = offset + newText.length;
    }
    return newText;
  });
  return (0, import_normalise_formats.normaliseFormats)({ formats, replacements, text, start, end });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  replace
});
//# sourceMappingURL=replace.cjs.map
