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

// packages/dom/src/dom/get-computed-style.js
var get_computed_style_exports = {};
__export(get_computed_style_exports, {
  default: () => getComputedStyle
});
module.exports = __toCommonJS(get_computed_style_exports);
var import_assert_is_defined = require("../utils/assert-is-defined.cjs");
function getComputedStyle(element) {
  (0, import_assert_is_defined.assertIsDefined)(
    element.ownerDocument.defaultView,
    "element.ownerDocument.defaultView"
  );
  return element.ownerDocument.defaultView.getComputedStyle(element);
}
//# sourceMappingURL=get-computed-style.cjs.map
