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

// packages/rich-text/src/concat.js
var concat_exports = {};
__export(concat_exports, {
  concat: () => concat,
  mergePair: () => mergePair
});
module.exports = __toCommonJS(concat_exports);
var import_normalise_formats = require("./normalise-formats.cjs");
var import_create = require("./create.cjs");
function mergePair(a, b) {
  a.formats = a.formats.concat(b.formats);
  a.replacements = a.replacements.concat(b.replacements);
  a.text += b.text;
  return a;
}
function concat(...values) {
  return (0, import_normalise_formats.normaliseFormats)(values.reduce(mergePair, (0, import_create.create)()));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  concat,
  mergePair
});
//# sourceMappingURL=concat.cjs.map
