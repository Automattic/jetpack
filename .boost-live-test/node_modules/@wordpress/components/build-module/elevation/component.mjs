// packages/components/src/elevation/component.tsx
import { contextConnect } from "../context/index.mjs";
import { View } from "../view/index.mjs";
import { useElevation } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedElevation(props, forwardedRef) {
  const elevationProps = useElevation(props);
  return /* @__PURE__ */ _jsx(View, {
    ...elevationProps,
    ref: forwardedRef
  });
}
var Elevation = contextConnect(UnconnectedElevation, "Elevation");
var component_default = Elevation;
export {
  Elevation,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
