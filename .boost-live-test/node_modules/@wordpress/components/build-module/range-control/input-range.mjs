// packages/components/src/range-control/input-range.tsx
import { forwardRef } from "@wordpress/element";
import { InputRange as BaseInputRange } from "./styles/range-control-styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function InputRange(props, ref) {
  const {
    describedBy,
    label,
    value,
    ...otherProps
  } = props;
  return /* @__PURE__ */ _jsx(BaseInputRange, {
    ...otherProps,
    "aria-describedby": describedBy,
    "aria-label": label,
    "aria-hidden": false,
    ref,
    tabIndex: 0,
    type: "range",
    value
  });
}
var ForwardedComponent = forwardRef(InputRange);
var input_range_default = ForwardedComponent;
export {
  input_range_default as default
};
//# sourceMappingURL=input-range.mjs.map
