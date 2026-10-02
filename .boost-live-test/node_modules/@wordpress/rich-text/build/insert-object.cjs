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

// packages/rich-text/src/insert-object.js
var insert_object_exports = {};
__export(insert_object_exports, {
  insertObject: () => insertObject
});
module.exports = __toCommonJS(insert_object_exports);
var import_insert = require("./insert.cjs");
var import_special_characters = require("./special-characters.cjs");
function insertObject(value, formatToInsert, startIndex, endIndex) {
  const valueToInsert = {
    formats: [,],
    replacements: [formatToInsert],
    text: import_special_characters.OBJECT_REPLACEMENT_CHARACTER
  };
  return (0, import_insert.insert)(value, valueToInsert, startIndex, endIndex);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  insertObject
});
//# sourceMappingURL=insert-object.cjs.map
