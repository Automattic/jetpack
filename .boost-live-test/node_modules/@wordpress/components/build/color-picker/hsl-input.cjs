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

// packages/components/src/color-picker/hsl-input.tsx
var hsl_input_exports = {};
__export(hsl_input_exports, {
  HslInput: () => HslInput
});
module.exports = __toCommonJS(hsl_input_exports);
var import_input_with_slider = require("./input-with-slider.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var HslInput = ({
  hsla,
  onChange,
  enableAlpha
}) => {
  const updateHSLAValue = (partialNewValue) => {
    onChange({
      ...hsla,
      ...partialNewValue
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, {
    children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_with_slider.InputWithSlider, {
      min: 0,
      max: 359,
      label: "Hue",
      abbreviation: "H",
      value: hsla.h,
      onChange: (nextH) => {
        updateHSLAValue({
          h: nextH
        });
      }
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_with_slider.InputWithSlider, {
      min: 0,
      max: 100,
      label: "Saturation",
      abbreviation: "S",
      value: hsla.s,
      onChange: (nextS) => {
        updateHSLAValue({
          s: nextS
        });
      }
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_with_slider.InputWithSlider, {
      min: 0,
      max: 100,
      label: "Lightness",
      abbreviation: "L",
      value: hsla.l,
      onChange: (nextL) => {
        updateHSLAValue({
          l: nextL
        });
      }
    }), enableAlpha && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_with_slider.InputWithSlider, {
      min: 0,
      max: 100,
      label: "Alpha",
      abbreviation: "A",
      value: Math.trunc(100 * hsla.a),
      onChange: (nextA) => {
        updateHSLAValue({
          a: nextA / 100
        });
      }
    })]
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HslInput
});
//# sourceMappingURL=hsl-input.cjs.map
