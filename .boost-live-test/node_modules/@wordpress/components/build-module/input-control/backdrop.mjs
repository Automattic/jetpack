// packages/components/src/input-control/backdrop.tsx
import { memo } from "@wordpress/element";
import { BackdropUI } from "./styles/input-control-styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function Backdrop({
  disabled = false,
  isBorderless = false
}) {
  return /* @__PURE__ */ _jsx(BackdropUI, {
    "aria-hidden": "true",
    className: "components-input-control__backdrop",
    disabled,
    isBorderless
  });
}
var MemoizedBackdrop = memo(Backdrop);
var backdrop_default = MemoizedBackdrop;
export {
  backdrop_default as default
};
//# sourceMappingURL=backdrop.mjs.map
