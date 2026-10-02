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

// packages/components/src/range-control/input-range.tsx
var input_range_exports = {};
__export(input_range_exports, {
  default: () => input_range_default
});
module.exports = __toCommonJS(input_range_exports);
var import_element = require("@wordpress/element");
var import_range_control_styles = require("./styles/range-control-styles.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function InputRange(props, ref) {
  const {
    describedBy,
    label,
    value,
    ...otherProps
  } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_range_control_styles.InputRange, {
    ...otherProps,
    "aria-describedby": describedBy,
    "aria-label": label,
    "aria-hidden": false,
    ref,
    tabIndex: 0,
    type: "range",
    value
  });
}
var ForwardedComponent = (0, import_element.forwardRef)(InputRange);
var input_range_default = ForwardedComponent;
//# sourceMappingURL=input-range.cjs.map
