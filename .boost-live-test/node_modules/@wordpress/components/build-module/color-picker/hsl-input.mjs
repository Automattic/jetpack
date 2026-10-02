// packages/components/src/color-picker/hsl-input.tsx
import { InputWithSlider } from "./input-with-slider.mjs";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
  return /* @__PURE__ */ _jsxs(_Fragment, {
    children: [/* @__PURE__ */ _jsx(InputWithSlider, {
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
    }), /* @__PURE__ */ _jsx(InputWithSlider, {
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
    }), /* @__PURE__ */ _jsx(InputWithSlider, {
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
    }), enableAlpha && /* @__PURE__ */ _jsx(InputWithSlider, {
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
export {
  HslInput
};
//# sourceMappingURL=hsl-input.mjs.map
