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

// packages/rich-text/src/create-element.js
var create_element_exports = {};
__export(create_element_exports, {
  createElement: () => createElement
});
module.exports = __toCommonJS(create_element_exports);
function createElement({ implementation }, html) {
  if (!createElement.body) {
    createElement.body = implementation.createHTMLDocument("").body;
  }
  createElement.body.innerHTML = html;
  return createElement.body;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createElement
});
//# sourceMappingURL=create-element.cjs.map
