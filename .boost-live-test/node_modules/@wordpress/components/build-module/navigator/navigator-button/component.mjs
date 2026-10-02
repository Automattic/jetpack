// packages/components/src/navigator/navigator-button/component.tsx
import { contextConnect } from "../../context/index.mjs";
import { View } from "../../view/index.mjs";
import { useNavigatorButton } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnconnectedNavigatorButton(props, forwardedRef) {
  const navigatorButtonProps = useNavigatorButton(props);
  return /* @__PURE__ */ _jsx(View, {
    ref: forwardedRef,
    ...navigatorButtonProps
  });
}
var NavigatorButton = contextConnect(UnconnectedNavigatorButton, "Navigator.Button");
export {
  NavigatorButton
};
//# sourceMappingURL=component.mjs.map
