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

// packages/dom/src/dom/document-has-selection.js
var document_has_selection_exports = {};
__export(document_has_selection_exports, {
  default: () => documentHasSelection
});
module.exports = __toCommonJS(document_has_selection_exports);
var import_is_text_field = __toESM(require("./is-text-field.cjs"));
var import_is_html_input_element = __toESM(require("./is-html-input-element.cjs"));
var import_document_has_text_selection = __toESM(require("./document-has-text-selection.cjs"));
function documentHasSelection(doc) {
  return !!doc.activeElement && ((0, import_is_html_input_element.default)(doc.activeElement) || (0, import_is_text_field.default)(doc.activeElement) || (0, import_document_has_text_selection.default)(doc));
}
//# sourceMappingURL=document-has-selection.cjs.map
