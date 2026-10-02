// packages/components/src/spacer/component.tsx
import { contextConnect } from "../context/index.mjs";
import { View } from "../view/index.mjs";
import { useSpacer } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedSpacer(props, forwardedRef) {
  const spacerProps = useSpacer(props);
  return /* @__PURE__ */ _jsx(View, {
    ...spacerProps,
    ref: forwardedRef
  });
}
var Spacer = contextConnect(UnconnectedSpacer, "Spacer");
var component_default = Spacer;
export {
  Spacer,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
