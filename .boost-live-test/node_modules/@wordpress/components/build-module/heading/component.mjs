// packages/components/src/heading/component.tsx
import { contextConnect } from "../context/index.mjs";
import { View } from "../view/index.mjs";
import { useHeading } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedHeading(props, forwardedRef) {
  const headerProps = useHeading(props);
  return /* @__PURE__ */ _jsx(View, {
    ...headerProps,
    ref: forwardedRef
  });
}
var Heading = contextConnect(UnconnectedHeading, "Heading");
var component_default = Heading;
export {
  Heading,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
