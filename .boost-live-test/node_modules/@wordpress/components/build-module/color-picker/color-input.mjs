// packages/components/src/color-picker/color-input.tsx
import { RgbInput } from "./rgb-input.mjs";
import { HslInput } from "./hsl-input.mjs";
import { HexInput } from "./hex-input.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
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
      return /* @__PURE__ */ _jsx(HslInput, {
        hsla,
        onChange: onHSLChange,
        enableAlpha
      });
    case "rgb":
      return /* @__PURE__ */ _jsx(RgbInput, {
        color,
        onChange,
        enableAlpha
      });
    default:
    case "hex":
      return /* @__PURE__ */ _jsx(HexInput, {
        color,
        onChange,
        enableAlpha
      });
  }
};
export {
  ColorInput
};
//# sourceMappingURL=color-input.mjs.map
