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

// packages/components/src/panel/header.tsx
var header_exports = {};
__export(header_exports, {
  default: () => header_default
});
module.exports = __toCommonJS(header_exports);
var import_jsx_runtime = require("react/jsx-runtime");
function PanelHeader({
  label,
  children
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
    className: "components-panel__header",
    children: [label && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
      children: label
    }), children]
  });
}
var header_default = PanelHeader;
//# sourceMappingURL=header.cjs.map
