// packages/components/src/higher-order/with-focus-return/index.tsx
import { Component } from "@wordpress/element";
import { createHigherOrderComponent, useFocusReturn } from "@wordpress/compose";
import deprecated from "@wordpress/deprecated";
import { jsx as _jsx } from "react/jsx-runtime";
function isComponentLike(object) {
  return object instanceof Component || typeof object === "function";
}
var with_focus_return_default = createHigherOrderComponent(
  // @ts-expect-error TODO: Reconcile with intended `createHigherOrderComponent` types
  (options) => {
    const HoC = ({
      onFocusReturn
    } = {}) => (WrappedComponent) => {
      const WithFocusReturn = (props) => {
        const ref = useFocusReturn(onFocusReturn);
        return /* @__PURE__ */ _jsx("div", {
          ref,
          children: /* @__PURE__ */ _jsx(WrappedComponent, {
            ...props
          })
        });
      };
      return WithFocusReturn;
    };
    if (isComponentLike(options)) {
      const WrappedComponent = options;
      return HoC()(WrappedComponent);
    }
    return HoC(options);
  },
  "withFocusReturn"
);
var Provider = ({
  children
}) => {
  deprecated("wp.components.FocusReturnProvider component", {
    since: "5.7",
    hint: "This provider is not used anymore. You can just remove it from your codebase"
  });
  return children;
};
export {
  Provider,
  with_focus_return_default as default
};
//# sourceMappingURL=index.mjs.map
