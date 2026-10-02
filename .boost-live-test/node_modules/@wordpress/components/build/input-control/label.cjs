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

// packages/components/src/input-control/label.tsx
var label_exports = {};
__export(label_exports, {
  default: () => Label
});
module.exports = __toCommonJS(label_exports);
var import_visually_hidden = require("../visually-hidden/index.cjs");
var import_input_control_styles = require("./styles/input-control-styles.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function Label({
  children,
  hideLabelFromVision,
  htmlFor,
  ...props
}) {
  if (!children) {
    return null;
  }
  if (hideLabelFromVision) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_visually_hidden.VisuallyHidden, {
      as: "label",
      htmlFor,
      children
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_control_styles.LabelWrapper, {
    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_control_styles.Label, {
      htmlFor,
      ...props,
      children
    })
  });
}
//# sourceMappingURL=label.cjs.map
