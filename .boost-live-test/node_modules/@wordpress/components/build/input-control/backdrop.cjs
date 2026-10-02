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

// packages/components/src/input-control/backdrop.tsx
var backdrop_exports = {};
__export(backdrop_exports, {
  default: () => backdrop_default
});
module.exports = __toCommonJS(backdrop_exports);
var import_element = require("@wordpress/element");
var import_input_control_styles = require("./styles/input-control-styles.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function Backdrop({
  disabled = false,
  isBorderless = false
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_control_styles.BackdropUI, {
    "aria-hidden": "true",
    className: "components-input-control__backdrop",
    disabled,
    isBorderless
  });
}
var MemoizedBackdrop = (0, import_element.memo)(Backdrop);
var backdrop_default = MemoizedBackdrop;
//# sourceMappingURL=backdrop.cjs.map
