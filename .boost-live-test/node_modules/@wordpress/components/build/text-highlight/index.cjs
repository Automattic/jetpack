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

// packages/components/src/text-highlight/index.tsx
var text_highlight_exports = {};
__export(text_highlight_exports, {
  TextHighlight: () => TextHighlight,
  default: () => text_highlight_default
});
module.exports = __toCommonJS(text_highlight_exports);
var import_element = require("@wordpress/element");
var import_strings = require("../utils/strings.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var TextHighlight = (props) => {
  const {
    text = "",
    highlight = ""
  } = props;
  const trimmedHighlightText = highlight.trim();
  if (!trimmedHighlightText) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, {
      children: text
    });
  }
  const regex = new RegExp(`(${(0, import_strings.escapeRegExp)(trimmedHighlightText)})`, "gi");
  return (0, import_element.createInterpolateElement)(text.replace(regex, "<mark>$&</mark>"), {
    mark: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("mark", {})
  });
};
TextHighlight.displayName = "TextHighlight";
var text_highlight_default = TextHighlight;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TextHighlight
});
//# sourceMappingURL=index.cjs.map
