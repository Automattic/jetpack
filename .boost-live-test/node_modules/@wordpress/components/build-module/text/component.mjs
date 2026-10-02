// packages/components/src/text/component.tsx
import { contextConnect } from "../context/index.mjs";
import { View } from "../view/index.mjs";
import useText from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedText(props, forwardedRef) {
  const textProps = useText(props);
  return /* @__PURE__ */ _jsx(View, {
    as: "span",
    ...textProps,
    ref: forwardedRef
  });
}
var Text = contextConnect(UnconnectedText, "Text");
var component_default = Text;
export {
  Text,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
