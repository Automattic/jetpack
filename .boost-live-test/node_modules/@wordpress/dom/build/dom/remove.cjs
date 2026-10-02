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

// packages/dom/src/dom/remove.js
var remove_exports = {};
__export(remove_exports, {
  default: () => remove
});
module.exports = __toCommonJS(remove_exports);
var import_assert_is_defined = require("../utils/assert-is-defined.cjs");
function remove(node) {
  (0, import_assert_is_defined.assertIsDefined)(node.parentNode, "node.parentNode");
  node.parentNode.removeChild(node);
}
//# sourceMappingURL=remove.cjs.map
