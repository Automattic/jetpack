// packages/components/src/panel/header.tsx
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function PanelHeader({
  label,
  children
}) {
  return /* @__PURE__ */ _jsxs("div", {
    className: "components-panel__header",
    children: [label && /* @__PURE__ */ _jsx("h2", {
      children: label
    }), children]
  });
}
var header_default = PanelHeader;
export {
  header_default as default
};
//# sourceMappingURL=header.mjs.map
