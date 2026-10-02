// packages/components/src/higher-order/with-constrained-tabbing/index.tsx
import { createHigherOrderComponent, useConstrainedTabbing } from "@wordpress/compose";
import { jsx as _jsx } from "react/jsx-runtime";
var withConstrainedTabbing = createHigherOrderComponent((WrappedComponent) => function ComponentWithConstrainedTabbing(props) {
  const ref = useConstrainedTabbing();
  return /* @__PURE__ */ _jsx("div", {
    ref,
    tabIndex: -1,
    children: /* @__PURE__ */ _jsx(WrappedComponent, {
      ...props
    })
  });
}, "withConstrainedTabbing");
var with_constrained_tabbing_default = withConstrainedTabbing;
export {
  with_constrained_tabbing_default as default
};
//# sourceMappingURL=index.mjs.map
