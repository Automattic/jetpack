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

// packages/components/src/color-picker/rgb-input.tsx
var rgb_input_exports = {};
__export(rgb_input_exports, {
  RgbInput: () => RgbInput
});
module.exports = __toCommonJS(rgb_input_exports);
var import_colord = require("colord");
var import_input_with_slider = require("./input-with-slider.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var RgbInput = ({
  color,
  onChange,
  enableAlpha
}) => {
  const {
    r,
    g,
    b,
    a
  } = color.toRgb();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, {
    children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_with_slider.InputWithSlider, {
      min: 0,
      max: 255,
      label: "Red",
      abbreviation: "R",
      value: r,
      onChange: (nextR) => onChange((0, import_colord.colord)({
        r: nextR,
        g,
        b,
        a
      }))
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_with_slider.InputWithSlider, {
      min: 0,
      max: 255,
      label: "Green",
      abbreviation: "G",
      value: g,
      onChange: (nextG) => onChange((0, import_colord.colord)({
        r,
        g: nextG,
        b,
        a
      }))
    }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_with_slider.InputWithSlider, {
      min: 0,
      max: 255,
      label: "Blue",
      abbreviation: "B",
      value: b,
      onChange: (nextB) => onChange((0, import_colord.colord)({
        r,
        g,
        b: nextB,
        a
      }))
    }), enableAlpha && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_input_with_slider.InputWithSlider, {
      min: 0,
      max: 100,
      label: "Alpha",
      abbreviation: "A",
      value: Math.trunc(a * 100),
      onChange: (nextA) => onChange((0, import_colord.colord)({
        r,
        g,
        b,
        a: nextA / 100
      }))
    })]
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RgbInput
});
//# sourceMappingURL=rgb-input.cjs.map
