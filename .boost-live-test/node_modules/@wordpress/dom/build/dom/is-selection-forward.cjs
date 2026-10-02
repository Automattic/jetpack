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

// packages/dom/src/dom/is-selection-forward.js
var is_selection_forward_exports = {};
__export(is_selection_forward_exports, {
  default: () => isSelectionForward
});
module.exports = __toCommonJS(is_selection_forward_exports);
var import_assert_is_defined = require("../utils/assert-is-defined.cjs");
function isSelectionForward(selection) {
  const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;
  (0, import_assert_is_defined.assertIsDefined)(anchorNode, "anchorNode");
  (0, import_assert_is_defined.assertIsDefined)(focusNode, "focusNode");
  const position = anchorNode.compareDocumentPosition(focusNode);
  if (position & anchorNode.DOCUMENT_POSITION_PRECEDING) {
    return false;
  }
  if (position & anchorNode.DOCUMENT_POSITION_FOLLOWING) {
    return true;
  }
  if (position === 0) {
    return anchorOffset <= focusOffset;
  }
  return true;
}
//# sourceMappingURL=is-selection-forward.cjs.map
