// packages/components/src/menu/submenu-trigger-item.tsx
import * as Ariakit from "@ariakit/react";
import { forwardRef, useContext } from "@wordpress/element";
import { chevronRightSmall } from "@wordpress/icons";
import { Context } from "./context.mjs";
import { Item } from "./item.mjs";
import * as Styled from "./styles.mjs";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
var SubmenuTriggerItem = forwardRef(function SubmenuTriggerItem2({
  suffix,
  ...otherProps
}, ref) {
  const menuContext = useContext(Context);
  if (!menuContext?.store.parent) {
    throw new Error("Menu.SubmenuTriggerItem can only be rendered inside a nested Menu component");
  }
  return /* @__PURE__ */ _jsx(Ariakit.MenuButton, {
    ref,
    accessibleWhenDisabled: true,
    store: menuContext.store,
    render: /* @__PURE__ */ _jsx(Item, {
      ...otherProps,
      // The menu item needs to register and be part of the parent menu.
      // Without specifying the store explicitly, the `Item` component
      // would otherwise read the store via context and pick up the one from
      // the sub-menu `Menu` component.
      store: menuContext.store.parent,
      suffix: /* @__PURE__ */ _jsxs(_Fragment, {
        children: [suffix, /* @__PURE__ */ _jsx(Styled.SubmenuChevronIcon, {
          "aria-hidden": "true",
          icon: chevronRightSmall,
          size: 24,
          preserveAspectRatio: "xMidYMid slice"
        })]
      })
    })
  });
});
export {
  SubmenuTriggerItem
};
//# sourceMappingURL=submenu-trigger-item.mjs.map
