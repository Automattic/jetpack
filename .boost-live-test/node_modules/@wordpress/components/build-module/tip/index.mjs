// packages/components/src/tip/index.tsx
import { Icon, tip } from "@wordpress/icons";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function Tip(props) {
  const {
    children
  } = props;
  return /* @__PURE__ */ _jsxs("div", {
    className: "components-tip",
    children: [/* @__PURE__ */ _jsx(Icon, {
      icon: tip
    }), /* @__PURE__ */ _jsx("p", {
      children
    })]
  });
}
var tip_default = Tip;
export {
  Tip,
  tip_default as default
};
//# sourceMappingURL=index.mjs.map
