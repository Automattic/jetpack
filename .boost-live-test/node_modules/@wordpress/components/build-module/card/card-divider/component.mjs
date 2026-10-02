// packages/components/src/card/card-divider/component.tsx
import { contextConnect } from "../../context/index.mjs";
import { Divider } from "../../divider/index.mjs";
import { useCardDivider } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedCardDivider(props, forwardedRef) {
  const dividerProps = useCardDivider(props);
  return /* @__PURE__ */ _jsx(Divider, {
    ...dividerProps,
    ref: forwardedRef
  });
}
var CardDivider = contextConnect(UnconnectedCardDivider, "CardDivider");
var component_default = CardDivider;
export {
  CardDivider,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
