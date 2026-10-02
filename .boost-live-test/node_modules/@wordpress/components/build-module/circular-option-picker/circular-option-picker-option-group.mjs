// packages/components/src/circular-option-picker/circular-option-picker-option-group.tsx
import clsx from "clsx";
import { jsx as _jsx } from "react/jsx-runtime";
function OptionGroup({
  className,
  options,
  ...additionalProps
}) {
  const role = "aria-label" in additionalProps || "aria-labelledby" in additionalProps ? "group" : void 0;
  return /* @__PURE__ */ _jsx("div", {
    ...additionalProps,
    role,
    className: clsx("components-circular-option-picker__option-group", "components-circular-option-picker__swatches", className),
    children: options
  });
}
export {
  OptionGroup
};
//# sourceMappingURL=circular-option-picker-option-group.mjs.map
