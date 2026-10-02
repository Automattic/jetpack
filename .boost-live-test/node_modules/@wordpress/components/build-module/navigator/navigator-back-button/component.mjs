// packages/components/src/navigator/navigator-back-button/component.tsx
import { contextConnect } from "../../context/index.mjs";
import { View } from "../../view/index.mjs";
import { useNavigatorBackButton } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedNavigatorBackButton(props, forwardedRef) {
  const navigatorBackButtonProps = useNavigatorBackButton(props);
  return /* @__PURE__ */ _jsx(View, {
    ref: forwardedRef,
    ...navigatorBackButtonProps
  });
}
var NavigatorBackButton = contextConnect(UnconnectedNavigatorBackButton, "Navigator.BackButton");
export {
  NavigatorBackButton
};
//# sourceMappingURL=component.mjs.map
