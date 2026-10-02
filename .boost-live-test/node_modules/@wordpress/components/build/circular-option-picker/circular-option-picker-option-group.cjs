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

// packages/components/src/circular-option-picker/circular-option-picker-option-group.tsx
var circular_option_picker_option_group_exports = {};
__export(circular_option_picker_option_group_exports, {
  OptionGroup: () => OptionGroup
});
module.exports = __toCommonJS(circular_option_picker_option_group_exports);
var import_clsx = __toESM(require("clsx"));
var import_jsx_runtime = require("react/jsx-runtime");
function OptionGroup({
  className,
  options,
  ...additionalProps
}) {
  const role = "aria-label" in additionalProps || "aria-labelledby" in additionalProps ? "group" : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
    ...additionalProps,
    role,
    className: (0, import_clsx.default)("components-circular-option-picker__option-group", "components-circular-option-picker__swatches", className),
    children: options
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OptionGroup
});
//# sourceMappingURL=circular-option-picker-option-group.cjs.map
