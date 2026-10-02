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

// packages/components/src/input-control/input-prefix-wrapper.tsx
var input_prefix_wrapper_exports = {};
__export(input_prefix_wrapper_exports, {
  InputControlPrefixWrapper: () => InputControlPrefixWrapper,
  default: () => input_prefix_wrapper_default
});
module.exports = __toCommonJS(input_prefix_wrapper_exports);
var import_context = require("../context/index.cjs");
var import_input_control_styles = require("./styles/input-control-styles.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function UnconnectedInputControlPrefixWrapper(props, forwardedRef) {
  const derivedProps = (0, import_context.useContextSystem)(props, "InputControlPrefixWrapper");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_control_styles.PrefixSuffixWrapper, {
    ...derivedProps,
    isPrefix: true,
    ref: forwardedRef
  });
}
var InputControlPrefixWrapper = (0, import_context.contextConnect)(UnconnectedInputControlPrefixWrapper, "InputControlPrefixWrapper");
var input_prefix_wrapper_default = InputControlPrefixWrapper;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  InputControlPrefixWrapper
});
//# sourceMappingURL=input-prefix-wrapper.cjs.map
