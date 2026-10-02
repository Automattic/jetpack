// packages/components/src/card/card-body/component.tsx
import { contextConnect } from "../../context/index.mjs";
import { Scrollable } from "../../scrollable/index.mjs";
import { View } from "../../view/index.mjs";
import { useCardBody } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedCardBody(props, forwardedRef) {
  const {
    isScrollable,
    ...otherProps
  } = useCardBody(props);
  if (isScrollable) {
    return /* @__PURE__ */ _jsx(Scrollable, {
      ...otherProps,
      ref: forwardedRef
    });
  }
  return /* @__PURE__ */ _jsx(View, {
    ...otherProps,
    ref: forwardedRef
  });
}
var CardBody = contextConnect(UnconnectedCardBody, "CardBody");
var component_default = CardBody;
export {
  CardBody,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
