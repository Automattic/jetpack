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

// packages/dom/src/dom/is-number-input.js
var is_number_input_exports = {};
__export(is_number_input_exports, {
  default: () => isNumberInput
});
module.exports = __toCommonJS(is_number_input_exports);
var import_deprecated = __toESM(require("@wordpress/deprecated"));
var import_is_html_input_element = __toESM(require("./is-html-input-element.cjs"));
function isNumberInput(node) {
  (0, import_deprecated.default)("wp.dom.isNumberInput", {
    since: "6.1",
    version: "6.5"
  });
  return (0, import_is_html_input_element.default)(node) && node.type === "number" && !isNaN(node.valueAsNumber);
}
//# sourceMappingURL=is-number-input.cjs.map
