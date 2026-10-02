// packages/components/src/flex/flex-block/component.tsx
import { contextConnect } from "../../context/index.mjs";
import { View } from "../../view/index.mjs";
import { useFlexBlock } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedFlexBlock(props, forwardedRef) {
  const flexBlockProps = useFlexBlock(props);
  return /* @__PURE__ */ _jsx(View, {
    ...flexBlockProps,
    ref: forwardedRef
  });
}
var FlexBlock = contextConnect(UnconnectedFlexBlock, "FlexBlock");
var component_default = FlexBlock;
export {
  FlexBlock,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
