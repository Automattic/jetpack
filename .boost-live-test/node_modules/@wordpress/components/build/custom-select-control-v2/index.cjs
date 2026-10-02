"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/custom-select-control-v2/index.tsx
var custom_select_control_v2_exports = {};
__export(custom_select_control_v2_exports, {
  default: () => custom_select_control_v2_default
});
module.exports = __toCommonJS(custom_select_control_v2_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_custom_select = __toESM(require("./custom-select.cjs"));
var import_item = __toESM(require("./item.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function CustomSelectControlV2(props) {
  const {
    defaultValue,
    onChange,
    value,
    ...restProps
  } = props;
  const store = Ariakit.useSelectStore({
    setValue: (nextValue) => onChange?.(nextValue),
    defaultValue,
    value
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_custom_select.default, {
    ...restProps,
    store
  });
}
CustomSelectControlV2.Item = import_item.default;
var custom_select_control_v2_default = CustomSelectControlV2;
//# sourceMappingURL=index.cjs.map
