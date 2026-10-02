// packages/components/src/input-control/input-suffix-wrapper.tsx
import { contextConnect, useContextSystem } from "../context/index.mjs";
import { PrefixSuffixWrapper } from "./styles/input-control-styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedInputControlSuffixWrapper(props, forwardedRef) {
  const derivedProps = useContextSystem(props, "InputControlSuffixWrapper");
  return /* @__PURE__ */ _jsx(PrefixSuffixWrapper, {
    ...derivedProps,
    ref: forwardedRef
  });
}
var InputControlSuffixWrapper = contextConnect(UnconnectedInputControlSuffixWrapper, "InputControlSuffixWrapper");
var input_suffix_wrapper_default = InputControlSuffixWrapper;
export {
  InputControlSuffixWrapper,
  input_suffix_wrapper_default as default
};
//# sourceMappingURL=input-suffix-wrapper.mjs.map
