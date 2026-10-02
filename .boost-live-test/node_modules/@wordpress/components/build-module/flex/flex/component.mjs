// packages/components/src/flex/flex/component.tsx
import { contextConnect } from "../../context/index.mjs";
import { useFlex } from "./hook.mjs";
import { FlexContext } from "../context.mjs";
import { View } from "../../view/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedFlex(props, forwardedRef) {
  const {
    children,
    isColumn,
    ...otherProps
  } = useFlex(props);
  return /* @__PURE__ */ _jsx(FlexContext.Provider, {
    value: {
      flexItemDisplay: isColumn ? "block" : void 0
    },
    children: /* @__PURE__ */ _jsx(View, {
      ...otherProps,
      ref: forwardedRef,
      children
    })
  });
}
var Flex = contextConnect(UnconnectedFlex, "Flex");
var component_default = Flex;
export {
  Flex,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
