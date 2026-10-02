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

// packages/dom/src/dom/is-entirely-selected.js
var is_entirely_selected_exports = {};
__export(is_entirely_selected_exports, {
  default: () => isEntirelySelected
});
module.exports = __toCommonJS(is_entirely_selected_exports);
var import_assert_is_defined = require("../utils/assert-is-defined.cjs");
var import_is_input_or_text_area = __toESM(require("./is-input-or-text-area.cjs"));
var ZWNBSP = "\uFEFF";
function isEntirelySelected(element) {
  if ((0, import_is_input_or_text_area.default)(element)) {
    return element.selectionStart === 0 && element.value.length === element.selectionEnd;
  }
  if (!element.isContentEditable) {
    return true;
  }
  const text = element.textContent || "";
  if (text === "" || text === ZWNBSP) {
    return true;
  }
  const { ownerDocument } = element;
  const { defaultView } = ownerDocument;
  (0, import_assert_is_defined.assertIsDefined)(defaultView, "defaultView");
  const selection = defaultView.getSelection();
  (0, import_assert_is_defined.assertIsDefined)(selection, "selection");
  const range = selection.rangeCount ? selection.getRangeAt(0) : null;
  if (!range) {
    return true;
  }
  const { startContainer, endContainer, startOffset, endOffset } = range;
  if (startContainer === element && endContainer === element && startOffset === 0 && endOffset === element.childNodes.length) {
    return true;
  }
  const lastChild = element.lastChild;
  (0, import_assert_is_defined.assertIsDefined)(lastChild, "lastChild");
  const endContainerContentLength = endContainer.nodeType === endContainer.TEXT_NODE ? (
    /** @type {Text} */
    endContainer.data.length
  ) : endContainer.childNodes.length;
  return isDeepChild(startContainer, element, "firstChild") && isDeepChild(endContainer, element, "lastChild") && startOffset === 0 && endOffset === endContainerContentLength;
}
function isDeepChild(query, container, propName) {
  let candidate = container;
  do {
    if (query === candidate) {
      return true;
    }
    candidate = candidate[propName];
    while (candidate && candidate.nodeType === candidate.TEXT_NODE && candidate.nodeValue === "") {
      candidate = candidate[propName === "lastChild" ? "previousSibling" : "nextSibling"];
    }
  } while (candidate);
  return false;
}
//# sourceMappingURL=is-entirely-selected.cjs.map
