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

// packages/dom/src/dom/document-has-text-selection.js
var document_has_text_selection_exports = {};
__export(document_has_text_selection_exports, {
  default: () => documentHasTextSelection
});
module.exports = __toCommonJS(document_has_text_selection_exports);
var import_assert_is_defined = require("../utils/assert-is-defined.cjs");
function documentHasTextSelection(doc) {
  (0, import_assert_is_defined.assertIsDefined)(doc.defaultView, "doc.defaultView");
  const selection = doc.defaultView.getSelection();
  (0, import_assert_is_defined.assertIsDefined)(selection, "selection");
  const range = selection.rangeCount ? selection.getRangeAt(0) : null;
  return !!range && !range.collapsed;
}
//# sourceMappingURL=document-has-text-selection.cjs.map
