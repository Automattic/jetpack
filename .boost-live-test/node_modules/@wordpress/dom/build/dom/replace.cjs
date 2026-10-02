"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/dom/src/dom/replace.js
var replace_exports = {};
__export(replace_exports, {
  default: () => replace
});
module.exports = __toCommonJS(replace_exports);
var import_assert_is_defined = require("../utils/assert-is-defined.cjs");
var import_insert_after = __toESM(require("./insert-after.cjs"));
var import_remove = __toESM(require("./remove.cjs"));
function replace(processedNode, newNode) {
  (0, import_assert_is_defined.assertIsDefined)(processedNode.parentNode, "processedNode.parentNode");
  (0, import_insert_after.default)(newNode, processedNode.parentNode);
  (0, import_remove.default)(processedNode);
}
//# sourceMappingURL=replace.cjs.map
