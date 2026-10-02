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

// packages/dom/src/dom/hidden-caret-range-from-point.js
var hidden_caret_range_from_point_exports = {};
__export(hidden_caret_range_from_point_exports, {
  default: () => hiddenCaretRangeFromPoint
});
module.exports = __toCommonJS(hidden_caret_range_from_point_exports);
var import_caret_range_from_point = __toESM(require("./caret-range-from-point.cjs"));
var import_get_computed_style = __toESM(require("./get-computed-style.cjs"));
function hiddenCaretRangeFromPoint(doc, x, y, container) {
  const originalZIndex = container.style.zIndex;
  const originalPosition = container.style.position;
  const originalBorderRadius = container.style.borderRadius;
  const { position = "static" } = (0, import_get_computed_style.default)(container);
  if (position === "static") {
    container.style.position = "relative";
  }
  container.style.zIndex = "10000";
  container.style.borderRadius = "0";
  const range = (0, import_caret_range_from_point.default)(doc, x, y);
  container.style.zIndex = originalZIndex;
  container.style.position = originalPosition;
  container.style.borderRadius = originalBorderRadius;
  return range;
}
//# sourceMappingURL=hidden-caret-range-from-point.cjs.map
