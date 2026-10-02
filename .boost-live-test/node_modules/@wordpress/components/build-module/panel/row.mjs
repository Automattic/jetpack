// packages/components/src/panel/row.tsx
import clsx from "clsx";
import { forwardRef } from "@wordpress/element";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedPanelRow({
  className,
  children
}, ref) {
  return /* @__PURE__ */ _jsx("div", {
    className: clsx("components-panel__row", className),
    ref,
    children
  });
}
var PanelRow = forwardRef(UnforwardedPanelRow);
PanelRow.displayName = "PanelRow";
var row_default = PanelRow;
export {
  PanelRow,
  row_default as default
};
//# sourceMappingURL=row.mjs.map
