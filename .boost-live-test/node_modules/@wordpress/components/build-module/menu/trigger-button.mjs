// packages/components/src/menu/trigger-button.tsx
import * as Ariakit from "@ariakit/react";
import { forwardRef, useContext } from "@wordpress/element";
import { Context } from "./context.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var TriggerButton = forwardRef(function TriggerButton2({
  children,
  disabled = false,
  ...props
}, ref) {
  const menuContext = useContext(Context);
  if (!menuContext?.store) {
    throw new Error("Menu.TriggerButton can only be rendered inside a Menu component");
  }
  if (menuContext.store.parent) {
    throw new Error("Menu.TriggerButton should not be rendered inside a nested Menu component. Use Menu.SubmenuTriggerItem instead.");
  }
  return /* @__PURE__ */ _jsx(Ariakit.MenuButton, {
    ref,
    ...props,
    disabled,
    store: menuContext.store,
    children
  });
});
export {
  TriggerButton
};
//# sourceMappingURL=trigger-button.mjs.map
