// packages/components/src/range-control/mark.tsx
import clsx from "clsx";
import { Mark, MarkLabel } from "./styles/range-control-styles.mjs";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
function RangeMark(props) {
  const {
    className,
    isFilled = false,
    label,
    style = {},
    ...otherProps
  } = props;
  const classes = clsx("components-range-control__mark", isFilled && "is-filled", className);
  const labelClasses = clsx("components-range-control__mark-label", isFilled && "is-filled");
  return /* @__PURE__ */ _jsxs(_Fragment, {
    children: [/* @__PURE__ */ _jsx(Mark, {
      ...otherProps,
      "aria-hidden": "true",
      className: classes,
      style
    }), label && /* @__PURE__ */ _jsx(MarkLabel, {
      "aria-hidden": "true",
      className: labelClasses,
      isFilled,
      style,
      children: label
    })]
  });
}
export {
  RangeMark as default
};
//# sourceMappingURL=mark.mjs.map
