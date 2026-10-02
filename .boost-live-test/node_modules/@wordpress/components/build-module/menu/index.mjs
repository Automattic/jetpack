// packages/components/src/menu/index.tsx
import * as Ariakit from "@ariakit/react";
import { useContext, useMemo } from "@wordpress/element";
import { isRTL as isRTLFn } from "@wordpress/i18n";
import { useContextSystem, contextConnectWithoutRef } from "../context/index.mjs";
import { Context } from "./context.mjs";
import { Item } from "./item.mjs";
import { CheckboxItem } from "./checkbox-item.mjs";
import { RadioItem } from "./radio-item.mjs";
import { Group } from "./group.mjs";
import { GroupLabel } from "./group-label.mjs";
import { Separator } from "./separator.mjs";
import { ItemLabel } from "./item-label.mjs";
import { ItemHelpText } from "./item-help-text.mjs";
import { TriggerButton } from "./trigger-button.mjs";
import { SubmenuTriggerItem } from "./submenu-trigger-item.mjs";
import { Popover } from "./popover.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var UnconnectedMenu = (props) => {
  const {
    children,
    defaultOpen = false,
    open,
    onOpenChange,
    placement,
    // From internal components context
    variant
  } = useContextSystem(props, "Menu");
  const parentContext = useContext(Context);
  const rtl = isRTLFn();
  let computedPlacement = placement ?? (parentContext?.store ? "right-start" : "bottom-start");
  if (rtl) {
    if (/right/.test(computedPlacement)) {
      computedPlacement = computedPlacement.replace("right", "left");
    } else if (/left/.test(computedPlacement)) {
      computedPlacement = computedPlacement.replace("left", "right");
    }
  }
  const menuStore = Ariakit.useMenuStore({
    parent: parentContext?.store,
    open,
    defaultOpen,
    placement: computedPlacement,
    focusLoop: true,
    setOpen(willBeOpen) {
      onOpenChange?.(willBeOpen);
    },
    rtl
  });
  const contextValue = useMemo(() => ({
    store: menuStore,
    variant
  }), [menuStore, variant]);
  return /* @__PURE__ */ _jsx(Context.Provider, {
    value: contextValue,
    children
  });
};
var Menu = Object.assign(contextConnectWithoutRef(UnconnectedMenu, "Menu"), {
  Context: Object.assign(Context, {
    displayName: "Menu.Context"
  }),
  /**
   * Renders a menu item inside the `Menu.Popover` or `Menu.Group` components.
   *
   * It can optionally contain one instance of the `Menu.ItemLabel` component
   * and one instance of the `Menu.ItemHelpText` component.
   */
  Item: Object.assign(Item, {
    displayName: "Menu.Item"
  }),
  /**
   * Renders a radio menu item inside the `Menu.Popover` or `Menu.Group`
   * components.
   *
   * It can optionally contain one instance of the `Menu.ItemLabel` component
   * and one instance of the `Menu.ItemHelpText` component.
   */
  RadioItem: Object.assign(RadioItem, {
    displayName: "Menu.RadioItem"
  }),
  /**
   * Renders a checkbox menu item inside the `Menu.Popover` or `Menu.Group`
   * components.
   *
   * It can optionally contain one instance of the `Menu.ItemLabel` component
   * and one instance of the `Menu.ItemHelpText` component.
   */
  CheckboxItem: Object.assign(CheckboxItem, {
    displayName: "Menu.CheckboxItem"
  }),
  /**
   * Renders a group for menu items.
   *
   * It should contain one instance of `Menu.GroupLabel` and one or more
   * instances of `Menu.Item`, `Menu.RadioItem`, or `Menu.CheckboxItem`.
   */
  Group: Object.assign(Group, {
    displayName: "Menu.Group"
  }),
  /**
   * Renders a label in a menu group.
   *
   * This component should be wrapped with `Menu.Group` so the
   * `aria-labelledby` is correctly set on the group element.
   */
  GroupLabel: Object.assign(GroupLabel, {
    displayName: "Menu.GroupLabel"
  }),
  /**
   * Renders a divider between menu items or menu groups.
   */
  Separator: Object.assign(Separator, {
    displayName: "Menu.Separator"
  }),
  /**
   * Renders a menu item's label text. It should be wrapped with `Menu.Item`,
   * `Menu.RadioItem`, or `Menu.CheckboxItem`.
   */
  ItemLabel: Object.assign(ItemLabel, {
    displayName: "Menu.ItemLabel"
  }),
  /**
   * Renders a menu item's help text. It should be wrapped with `Menu.Item`,
   * `Menu.RadioItem`, or `Menu.CheckboxItem`.
   */
  ItemHelpText: Object.assign(ItemHelpText, {
    displayName: "Menu.ItemHelpText"
  }),
  /**
   * Renders a dropdown menu element that's controlled by a sibling
   * `Menu.TriggerButton` component. It renders a popover and automatically
   * focuses on items when the menu is shown.
   *
   * The only valid children of `Menu.Popover` are `Menu.Item`,
   * `Menu.RadioItem`, `Menu.CheckboxItem`, `Menu.Group`, `Menu.Separator`,
   * and `Menu` (for nested dropdown menus).
   */
  Popover: Object.assign(Popover, {
    displayName: "Menu.Popover"
  }),
  /**
   * Renders a menu button that toggles the visibility of a sibling
   * `Menu.Popover` component when clicked or when using arrow keys.
   */
  TriggerButton: Object.assign(TriggerButton, {
    displayName: "Menu.TriggerButton"
  }),
  /**
   * Renders a menu item that toggles the visibility of a sibling
   * `Menu.Popover` component when clicked or when using arrow keys.
   *
   * This component is used to create a nested dropdown menu.
   */
  SubmenuTriggerItem: Object.assign(SubmenuTriggerItem, {
    displayName: "Menu.SubmenuTriggerItem"
  })
});
var menu_default = Menu;
export {
  Menu,
  menu_default as default
};
//# sourceMappingURL=index.mjs.map
