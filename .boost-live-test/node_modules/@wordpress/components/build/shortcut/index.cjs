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

// packages/components/src/shortcut/index.tsx
var shortcut_exports = {};
__export(shortcut_exports, {
  default: () => shortcut_default
});
module.exports = __toCommonJS(shortcut_exports);
var import_jsx_runtime = require("react/jsx-runtime");
function Shortcut(props) {
  const {
    shortcut,
    className
  } = props;
  if (!shortcut) {
    return null;
  }
  let displayText;
  let ariaLabel;
  if (typeof shortcut === "string") {
    displayText = shortcut;
  }
  if (shortcut !== null && typeof shortcut === "object") {
    displayText = shortcut.display;
    ariaLabel = shortcut.ariaLabel;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
    className,
    "aria-label": ariaLabel,
    children: displayText
  });
}
var shortcut_default = Shortcut;
//# sourceMappingURL=index.cjs.map
