// packages/components/src/input-control/label.tsx
import { VisuallyHidden } from "../visually-hidden/index.mjs";
import { Label as BaseLabel, LabelWrapper } from "./styles/input-control-styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function Label({
  children,
  hideLabelFromVision,
  htmlFor,
  ...props
}) {
  if (!children) {
    return null;
  }
  if (hideLabelFromVision) {
    return /* @__PURE__ */ _jsx(VisuallyHidden, {
      as: "label",
      htmlFor,
      children
    });
  }
  return /* @__PURE__ */ _jsx(LabelWrapper, {
    children: /* @__PURE__ */ _jsx(BaseLabel, {
      htmlFor,
      ...props,
      children
    })
  });
}
export {
  Label as default
};
//# sourceMappingURL=label.mjs.map
