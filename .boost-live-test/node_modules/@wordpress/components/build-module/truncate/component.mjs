// packages/components/src/truncate/component.tsx
import { contextConnect } from "../context/index.mjs";
import { View } from "../view/index.mjs";
import useTruncate from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedTruncate(props, forwardedRef) {
  const truncateProps = useTruncate(props);
  return /* @__PURE__ */ _jsx(View, {
    as: "span",
    ...truncateProps,
    ref: forwardedRef
  });
}
var Truncate = contextConnect(UnconnectedTruncate, "Truncate");
var component_default = Truncate;
export {
  Truncate,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
