// packages/components/src/navigator/navigator-to-parent-button/component.tsx
import deprecated from "@wordpress/deprecated";
import { NavigatorBackButton } from "../navigator-back-button/component.mjs";
import { contextConnect } from "../../context/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedNavigatorToParentButton(props, forwardedRef) {
  deprecated("wp.components.NavigatorToParentButton", {
    since: "6.7",
    alternative: "wp.components.Navigator.BackButton"
  });
  return /* @__PURE__ */ _jsx(NavigatorBackButton, {
    ref: forwardedRef,
    ...props
  });
}
var NavigatorToParentButton = contextConnect(UnconnectedNavigatorToParentButton, "Navigator.ToParentButton");
export {
  NavigatorToParentButton
};
//# sourceMappingURL=component.mjs.map
