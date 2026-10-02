// packages/components/src/input-control/input-prefix-wrapper.tsx
import { contextConnect, useContextSystem } from "../context/index.mjs";
import { PrefixSuffixWrapper } from "./styles/input-control-styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedInputControlPrefixWrapper(props, forwardedRef) {
  const derivedProps = useContextSystem(props, "InputControlPrefixWrapper");
  return /* @__PURE__ */ _jsx(PrefixSuffixWrapper, {
    ...derivedProps,
    isPrefix: true,
    ref: forwardedRef
  });
}
var InputControlPrefixWrapper = contextConnect(UnconnectedInputControlPrefixWrapper, "InputControlPrefixWrapper");
var input_prefix_wrapper_default = InputControlPrefixWrapper;
export {
  InputControlPrefixWrapper,
  input_prefix_wrapper_default as default
};
//# sourceMappingURL=input-prefix-wrapper.mjs.map
