// packages/components/src/grid/component.tsx
import { contextConnect } from "../context/index.mjs";
import { View } from "../view/index.mjs";
import useGrid from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedGrid(props, forwardedRef) {
  const gridProps = useGrid(props);
  return /* @__PURE__ */ _jsx(View, {
    ...gridProps,
    ref: forwardedRef
  });
}
var Grid = contextConnect(UnconnectedGrid, "Grid");
var component_default = Grid;
export {
  Grid,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
