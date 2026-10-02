// packages/components/src/color-indicator/index.tsx
import clsx from "clsx";
import { forwardRef } from "@wordpress/element";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedColorIndicator(props, forwardedRef) {
  const {
    className,
    colorValue,
    ...additionalProps
  } = props;
  return /* @__PURE__ */ _jsx("span", {
    className: clsx("component-color-indicator", className),
    style: {
      background: colorValue
    },
    ref: forwardedRef,
    ...additionalProps
  });
}
var ColorIndicator = forwardRef(UnforwardedColorIndicator);
ColorIndicator.displayName = "ColorIndicator";
var color_indicator_default = ColorIndicator;
export {
  ColorIndicator,
  color_indicator_default as default
};
//# sourceMappingURL=index.mjs.map
