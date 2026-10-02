// packages/components/src/card/card-footer/component.tsx
import { contextConnect } from "../../context/index.mjs";
import { Flex } from "../../flex/index.mjs";
import { useCardFooter } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedCardFooter(props, forwardedRef) {
  const footerProps = useCardFooter(props);
  return /* @__PURE__ */ _jsx(Flex, {
    ...footerProps,
    ref: forwardedRef
  });
}
var CardFooter = contextConnect(UnconnectedCardFooter, "CardFooter");
var component_default = CardFooter;
export {
  CardFooter,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
