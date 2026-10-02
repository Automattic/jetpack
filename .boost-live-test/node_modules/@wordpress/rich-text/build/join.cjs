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

// packages/rich-text/src/join.js
var join_exports = {};
__export(join_exports, {
  join: () => join
});
module.exports = __toCommonJS(join_exports);
var import_create = require("./create.cjs");
var import_normalise_formats = require("./normalise-formats.cjs");
function join(values, separator = "") {
  if (typeof separator === "string") {
    separator = (0, import_create.create)({ text: separator });
  }
  return (0, import_normalise_formats.normaliseFormats)(
    values.reduce((accumulator, { formats, replacements, text }) => ({
      formats: accumulator.formats.concat(separator.formats, formats),
      replacements: accumulator.replacements.concat(
        separator.replacements,
        replacements
      ),
      text: accumulator.text + separator.text + text
    }))
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  join
});
//# sourceMappingURL=join.cjs.map
