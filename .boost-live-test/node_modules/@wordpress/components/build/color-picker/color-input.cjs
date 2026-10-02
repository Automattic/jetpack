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

// packages/components/src/color-picker/color-input.tsx
var color_input_exports = {};
__export(color_input_exports, {
  ColorInput: () => ColorInput
});
module.exports = __toCommonJS(color_input_exports);
var import_rgb_input = require("./rgb-input.cjs");
var import_hsl_input = require("./hsl-input.cjs");
var import_hex_input = require("./hex-input.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var ColorInput = ({
  colorType,
  color,
  hsla,
  onChange,
  onHSLChange,
  enableAlpha
}) => {
  switch (colorType) {
    case "hsl":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_hsl_input.HslInput, {
        hsla,
        onChange: onHSLChange,
        enableAlpha
      });
    case "rgb":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_rgb_input.RgbInput, {
        color,
        onChange,
        enableAlpha
      });
    default:
    case "hex":
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_hex_input.HexInput, {
        color,
        onChange,
        enableAlpha
      });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ColorInput
});
//# sourceMappingURL=color-input.cjs.map
