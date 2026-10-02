// packages/components/src/scrollable/component.tsx
import { contextConnect } from "../context/index.mjs";
import { View } from "../view/index.mjs";
import { useScrollable } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedScrollable(props, forwardedRef) {
  const scrollableProps = useScrollable(props);
  return /* @__PURE__ */ _jsx(View, {
    ...scrollableProps,
    ref: forwardedRef
  });
}
var Scrollable = contextConnect(UnconnectedScrollable, "Scrollable");
var component_default = Scrollable;
export {
  Scrollable,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
