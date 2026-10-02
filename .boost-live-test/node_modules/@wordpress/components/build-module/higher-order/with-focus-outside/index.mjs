// packages/components/src/higher-order/with-focus-outside/index.tsx
import { useCallback, useState } from "@wordpress/element";
import { createHigherOrderComponent, __experimentalUseFocusOutside as useFocusOutside } from "@wordpress/compose";
import { jsx as _jsx } from "react/jsx-runtime";
var with_focus_outside_default = createHigherOrderComponent((WrappedComponent) => function WithFocusOutside(props) {
  const [handleFocusOutside, setHandleFocusOutside] = useState(void 0);
  const bindFocusOutsideHandler = useCallback((node) => setHandleFocusOutside(() => node?.handleFocusOutside ? node.handleFocusOutside.bind(node) : void 0), []);
  return /* @__PURE__ */ _jsx("div", {
    ...useFocusOutside(handleFocusOutside),
    children: /* @__PURE__ */ _jsx(WrappedComponent, {
      ref: bindFocusOutsideHandler,
      ...props
    })
  });
}, "withFocusOutside");
export {
  with_focus_outside_default as default
};
//# sourceMappingURL=index.mjs.map
