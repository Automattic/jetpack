// packages/components/src/border-box-control/border-box-control-visualizer/component.tsx
import { View } from "../../view/index.mjs";
import { contextConnect } from "../../context/index.mjs";
import { useBorderBoxControlVisualizer } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var BorderBoxControlVisualizer = (props, forwardedRef) => {
  const {
    value,
    ...otherProps
  } = useBorderBoxControlVisualizer(props);
  return /* @__PURE__ */ _jsx(View, {
    ...otherProps,
    ref: forwardedRef
  });
};
var ConnectedBorderBoxControlVisualizer = contextConnect(BorderBoxControlVisualizer, "BorderBoxControlVisualizer");
var component_default = ConnectedBorderBoxControlVisualizer;
export {
  component_default as default
};
//# sourceMappingURL=component.mjs.map
