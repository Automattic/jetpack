// packages/components/src/h-stack/component.tsx
import { contextConnect } from "../context/index.mjs";
import { View } from "../view/index.mjs";
import { useHStack } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedHStack(props, forwardedRef) {
  const hStackProps = useHStack(props);
  return /* @__PURE__ */ _jsx(View, {
    ...hStackProps,
    ref: forwardedRef
  });
}
var HStack = contextConnect(UnconnectedHStack, "HStack");
var component_default = HStack;
export {
  HStack,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
