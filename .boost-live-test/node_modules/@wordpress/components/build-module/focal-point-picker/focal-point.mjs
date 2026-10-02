// packages/components/src/focal-point-picker/focal-point.tsx
import { PointerCircle } from "./styles/focal-point-style.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function FocalPoint({
  left = "50%",
  top = "50%",
  ...props
}) {
  const style = {
    left,
    top
  };
  return /* @__PURE__ */ _jsx(PointerCircle, {
    ...props,
    className: "components-focal-point-picker__icon_container",
    style
  });
}
export {
  FocalPoint as default
};
//# sourceMappingURL=focal-point.mjs.map
