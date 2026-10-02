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

// packages/components/src/tip/index.tsx
var tip_exports = {};
__export(tip_exports, {
  Tip: () => Tip,
  default: () => tip_default
});
module.exports = __toCommonJS(tip_exports);
var import_icons = require("@wordpress/icons");
var import_jsx_runtime = require("react/jsx-runtime");
function Tip(props) {
  const {
    children
  } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
    className: "components-tip",
    children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icons.Icon, {
      icon: import_icons.tip
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
      children
    })]
  });
}
var tip_default = Tip;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Tip
});
//# sourceMappingURL=index.cjs.map
