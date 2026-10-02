// packages/components/src/button/deprecated.tsx
import deprecated from "@wordpress/deprecated";
import { forwardRef } from "@wordpress/element";
import Button from "./index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedIconButton({
  label,
  labelPosition,
  size,
  tooltip,
  ...props
}, ref) {
  deprecated("wp.components.IconButton", {
    since: "5.4",
    alternative: "wp.components.Button",
    version: "6.2"
  });
  return (
    // Disable reason: the parent component is taking care of the __next40pxDefaultSize prop.
    // eslint-disable-next-line @wordpress/components-no-missing-40px-size-prop
    /* @__PURE__ */ _jsx(Button, {
      ...props,
      ref,
      tooltipPosition: labelPosition,
      iconSize: size,
      showTooltip: tooltip !== void 0 ? !!tooltip : void 0,
      label: tooltip || label
    })
  );
}
var deprecated_default = forwardRef(UnforwardedIconButton);
export {
  deprecated_default as default
};
//# sourceMappingURL=deprecated.mjs.map
