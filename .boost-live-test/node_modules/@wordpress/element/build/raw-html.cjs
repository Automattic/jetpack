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

// packages/element/src/raw-html.ts
var raw_html_exports = {};
__export(raw_html_exports, {
  default: () => RawHTML
});
module.exports = __toCommonJS(raw_html_exports);
var import_react = require("./react.cjs");
function RawHTML({ children, ...props }) {
  let rawHtml = "";
  import_react.Children.toArray(children).forEach((child) => {
    if (typeof child === "string" && child.trim() !== "") {
      rawHtml += child;
    }
  });
  return (0, import_react.createElement)("div", {
    dangerouslySetInnerHTML: { __html: rawHtml },
    ...props
  });
}
//# sourceMappingURL=raw-html.cjs.map
