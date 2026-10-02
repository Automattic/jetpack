// packages/components/src/flex/flex-item/component.tsx
import { contextConnect } from "../../context/index.mjs";
import { View } from "../../view/index.mjs";
import { useFlexItem } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedFlexItem(props, forwardedRef) {
  const flexItemProps = useFlexItem(props);
  return /* @__PURE__ */ _jsx(View, {
    ...flexItemProps,
    ref: forwardedRef
  });
}
var FlexItem = contextConnect(UnconnectedFlexItem, "FlexItem");
var component_default = FlexItem;
export {
  FlexItem,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
