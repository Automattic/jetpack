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

// packages/rich-text/src/remove.js
var remove_exports = {};
__export(remove_exports, {
  remove: () => remove
});
module.exports = __toCommonJS(remove_exports);
var import_insert = require("./insert.cjs");
var import_create = require("./create.cjs");
function remove(value, startIndex, endIndex) {
  return (0, import_insert.insert)(value, (0, import_create.create)(), startIndex, endIndex);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  remove
});
//# sourceMappingURL=remove.cjs.map
