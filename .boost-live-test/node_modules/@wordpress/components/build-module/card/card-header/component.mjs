// packages/components/src/card/card-header/component.tsx
import { contextConnect } from "../../context/index.mjs";
import { Flex } from "../../flex/index.mjs";
import { useCardHeader } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedCardHeader(props, forwardedRef) {
  const headerProps = useCardHeader(props);
  return /* @__PURE__ */ _jsx(Flex, {
    ...headerProps,
    ref: forwardedRef
  });
}
var CardHeader = contextConnect(UnconnectedCardHeader, "CardHeader");
var component_default = CardHeader;
export {
  CardHeader,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
