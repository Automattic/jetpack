// packages/components/src/duotone-picker/duotone-swatch.tsx
import { swatch } from "@wordpress/icons";
import ColorIndicator from "../color-indicator/index.mjs";
import Icon from "../icon/index.mjs";
import { getGradientFromCSSColors } from "./utils.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function DuotoneSwatch({
  values
}) {
  return values ? /* @__PURE__ */ _jsx(ColorIndicator, {
    colorValue: getGradientFromCSSColors(values, "135deg")
  }) : /* @__PURE__ */ _jsx(Icon, {
    icon: swatch
  });
}
var duotone_swatch_default = DuotoneSwatch;
export {
  duotone_swatch_default as default
};
//# sourceMappingURL=duotone-swatch.mjs.map
