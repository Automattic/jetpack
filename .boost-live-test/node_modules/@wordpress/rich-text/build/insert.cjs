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

// packages/rich-text/src/insert.js
var insert_exports = {};
__export(insert_exports, {
  insert: () => insert
});
module.exports = __toCommonJS(insert_exports);
var import_create = require("./create.cjs");
var import_normalise_formats = require("./normalise-formats.cjs");
function insert(value, valueToInsert, startIndex = value.start, endIndex = value.end) {
  const { formats, replacements, text } = value;
  if (typeof valueToInsert === "string") {
    valueToInsert = (0, import_create.create)({ text: valueToInsert });
  }
  const index = startIndex + valueToInsert.text.length;
  return (0, import_normalise_formats.normaliseFormats)({
    formats: formats.slice(0, startIndex).concat(valueToInsert.formats, formats.slice(endIndex)),
    replacements: replacements.slice(0, startIndex).concat(
      valueToInsert.replacements,
      replacements.slice(endIndex)
    ),
    text: text.slice(0, startIndex) + valueToInsert.text + text.slice(endIndex),
    start: index,
    end: index
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  insert
});
//# sourceMappingURL=insert.cjs.map
