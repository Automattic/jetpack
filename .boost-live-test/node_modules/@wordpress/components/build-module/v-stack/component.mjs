// packages/components/src/v-stack/component.tsx
import { contextConnect } from "../context/index.mjs";
import { View } from "../view/index.mjs";
import { useVStack } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedVStack(props, forwardedRef) {
  const vStackProps = useVStack(props);
  return /* @__PURE__ */ _jsx(View, {
    ...vStackProps,
    ref: forwardedRef
  });
}
var VStack = contextConnect(UnconnectedVStack, "VStack");
var component_default = VStack;
export {
  VStack,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
