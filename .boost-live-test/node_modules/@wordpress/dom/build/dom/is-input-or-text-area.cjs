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

// packages/dom/src/dom/is-input-or-text-area.js
var is_input_or_text_area_exports = {};
__export(is_input_or_text_area_exports, {
  default: () => isInputOrTextArea
});
module.exports = __toCommonJS(is_input_or_text_area_exports);
function isInputOrTextArea(element) {
  return element.tagName === "INPUT" || element.tagName === "TEXTAREA";
}
//# sourceMappingURL=is-input-or-text-area.cjs.map
