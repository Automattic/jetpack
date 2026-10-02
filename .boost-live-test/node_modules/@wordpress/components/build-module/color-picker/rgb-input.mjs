// packages/components/src/color-picker/rgb-input.tsx
import { colord } from "colord";
import { InputWithSlider } from "./input-with-slider.mjs";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
  return /* @__PURE__ */ _jsxs(_Fragment, {
    children: [/* @__PURE__ */ _jsx(InputWithSlider, {
      min: 0,
      max: 255,
      label: "Red",
      abbreviation: "R",
      value: r,
      onChange: (nextR) => onChange(colord({
        r: nextR,
        g,
        b,
        a
      }))
    }), /* @__PURE__ */ _jsx(InputWithSlider, {
      min: 0,
      max: 255,
      label: "Green",
      abbreviation: "G",
      value: g,
      onChange: (nextG) => onChange(colord({
        r,
        g: nextG,
        b,
        a
      }))
    }), /* @__PURE__ */ _jsx(InputWithSlider, {
      min: 0,
      max: 255,
      label: "Blue",
      abbreviation: "B",
      value: b,
      onChange: (nextB) => onChange(colord({
        r,
        g,
        b: nextB,
        a
      }))
    }), enableAlpha && /* @__PURE__ */ _jsx(InputWithSlider, {
      min: 0,
      max: 100,
      label: "Alpha",
      abbreviation: "A",
      value: Math.trunc(a * 100),
      onChange: (nextA) => onChange(colord({
        r,
        g,
        b,
        a: nextA / 100
      }))
    })]
  });
};
export {
  RgbInput
};
//# sourceMappingURL=rgb-input.mjs.map
