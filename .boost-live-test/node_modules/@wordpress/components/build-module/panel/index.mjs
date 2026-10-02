// packages/components/src/panel/index.tsx
import clsx from "clsx";
import { forwardRef } from "@wordpress/element";
import PanelHeader from "./header.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function UnforwardedPanel({
  header,
  className,
  children
}, ref) {
  const classNames = clsx(className, "components-panel");
  return /* @__PURE__ */ _jsxs("div", {
    className: classNames,
    ref,
    children: [header && /* @__PURE__ */ _jsx(PanelHeader, {
      label: header
    }), children]
  });
}
var Panel = forwardRef(UnforwardedPanel);
Panel.displayName = "Panel";
var panel_default = Panel;
export {
  Panel,
  panel_default as default
};
//# sourceMappingURL=index.mjs.map
