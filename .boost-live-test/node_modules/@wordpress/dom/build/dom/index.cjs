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

// packages/dom/src/dom/index.js
var dom_exports = {};
__export(dom_exports, {
  __unstableStripHTML: () => import_strip_html.default,
  computeCaretRect: () => import_compute_caret_rect.default,
  documentHasSelection: () => import_document_has_selection.default,
  documentHasTextSelection: () => import_document_has_text_selection.default,
  documentHasUncollapsedSelection: () => import_document_has_uncollapsed_selection.default,
  getOffsetParent: () => import_get_offset_parent.default,
  getRectangleFromRange: () => import_get_rectangle_from_range.default,
  getScrollContainer: () => import_get_scroll_container.default,
  insertAfter: () => import_insert_after.default,
  isEmpty: () => import_is_empty.default,
  isEntirelySelected: () => import_is_entirely_selected.default,
  isFormElement: () => import_is_form_element.default,
  isHorizontalEdge: () => import_is_horizontal_edge.default,
  isNumberInput: () => import_is_number_input.default,
  isRTL: () => import_is_rtl.default,
  isSelectionForward: () => import_is_selection_forward.default,
  isTextField: () => import_is_text_field.default,
  isVerticalEdge: () => import_is_vertical_edge.default,
  placeCaretAtHorizontalEdge: () => import_place_caret_at_horizontal_edge.default,
  placeCaretAtVerticalEdge: () => import_place_caret_at_vertical_edge.default,
  remove: () => import_remove.default,
  removeInvalidHTML: () => import_remove_invalid_html.default,
  replace: () => import_replace.default,
  replaceTag: () => import_replace_tag.default,
  safeHTML: () => import_safe_html.default,
  unwrap: () => import_unwrap.default,
  wrap: () => import_wrap.default
});
module.exports = __toCommonJS(dom_exports);
var import_compute_caret_rect = __toESM(require("./compute-caret-rect.cjs"));
var import_document_has_text_selection = __toESM(require("./document-has-text-selection.cjs"));
var import_document_has_uncollapsed_selection = __toESM(require("./document-has-uncollapsed-selection.cjs"));
var import_document_has_selection = __toESM(require("./document-has-selection.cjs"));
var import_get_rectangle_from_range = __toESM(require("./get-rectangle-from-range.cjs"));
var import_get_scroll_container = __toESM(require("./get-scroll-container.cjs"));
var import_get_offset_parent = __toESM(require("./get-offset-parent.cjs"));
var import_is_entirely_selected = __toESM(require("./is-entirely-selected.cjs"));
var import_is_form_element = __toESM(require("./is-form-element.cjs"));
var import_is_horizontal_edge = __toESM(require("./is-horizontal-edge.cjs"));
var import_is_number_input = __toESM(require("./is-number-input.cjs"));
var import_is_text_field = __toESM(require("./is-text-field.cjs"));
var import_is_vertical_edge = __toESM(require("./is-vertical-edge.cjs"));
var import_place_caret_at_horizontal_edge = __toESM(require("./place-caret-at-horizontal-edge.cjs"));
var import_place_caret_at_vertical_edge = __toESM(require("./place-caret-at-vertical-edge.cjs"));
var import_replace = __toESM(require("./replace.cjs"));
var import_remove = __toESM(require("./remove.cjs"));
var import_insert_after = __toESM(require("./insert-after.cjs"));
var import_unwrap = __toESM(require("./unwrap.cjs"));
var import_replace_tag = __toESM(require("./replace-tag.cjs"));
var import_wrap = __toESM(require("./wrap.cjs"));
var import_strip_html = __toESM(require("./strip-html.cjs"));
var import_is_empty = __toESM(require("./is-empty.cjs"));
var import_remove_invalid_html = __toESM(require("./remove-invalid-html.cjs"));
var import_is_rtl = __toESM(require("./is-rtl.cjs"));
var import_safe_html = __toESM(require("./safe-html.cjs"));
var import_is_selection_forward = __toESM(require("./is-selection-forward.cjs"));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  __unstableStripHTML,
  computeCaretRect,
  documentHasSelection,
  documentHasTextSelection,
  documentHasUncollapsedSelection,
  getOffsetParent,
  getRectangleFromRange,
  getScrollContainer,
  insertAfter,
  isEmpty,
  isEntirelySelected,
  isFormElement,
  isHorizontalEdge,
  isNumberInput,
  isRTL,
  isSelectionForward,
  isTextField,
  isVerticalEdge,
  placeCaretAtHorizontalEdge,
  placeCaretAtVerticalEdge,
  remove,
  removeInvalidHTML,
  replace,
  replaceTag,
  safeHTML,
  unwrap,
  wrap
});
//# sourceMappingURL=index.cjs.map
