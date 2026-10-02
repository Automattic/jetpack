"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/menu/index.tsx
var menu_exports = {};
__export(menu_exports, {
  Menu: () => Menu,
  default: () => menu_default
});
module.exports = __toCommonJS(menu_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_element = require("@wordpress/element");
var import_i18n = require("@wordpress/i18n");
var import_context = require("../context/index.cjs");
var import_context2 = require("./context.cjs");
var import_item = require("./item.cjs");
var import_checkbox_item = require("./checkbox-item.cjs");
var import_radio_item = require("./radio-item.cjs");
var import_group = require("./group.cjs");
var import_group_label = require("./group-label.cjs");
var import_separator = require("./separator.cjs");
var import_item_label = require("./item-label.cjs");
var import_item_help_text = require("./item-help-text.cjs");
var import_trigger_button = require("./trigger-button.cjs");
var import_submenu_trigger_item = require("./submenu-trigger-item.cjs");
var import_popover = require("./popover.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var UnconnectedMenu = (props) => {
  const {
    children,
    defaultOpen = false,
    open,
    onOpenChange,
    placement,
    // From internal components context
    variant
  } = (0, import_context.useContextSystem)(props, "Menu");
  const parentContext = (0, import_element.useContext)(import_context2.Context);
  const rtl = (0, import_i18n.isRTL)();
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
  const contextValue = (0, import_element.useMemo)(() => ({
    store: menuStore,
    variant
  }), [menuStore, variant]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_context2.Context.Provider, {
    value: contextValue,
    children
  });
};
var Menu = Object.assign((0, import_context.contextConnectWithoutRef)(UnconnectedMenu, "Menu"), {
  Context: Object.assign(import_context2.Context, {
    displayName: "Menu.Context"
  }),
  /**
   * Renders a menu item inside the `Menu.Popover` or `Menu.Group` components.
   *
   * It can optionally contain one instance of the `Menu.ItemLabel` component
   * and one instance of the `Menu.ItemHelpText` component.
   */
  Item: Object.assign(import_item.Item, {
    displayName: "Menu.Item"
  }),
  /**
   * Renders a radio menu item inside the `Menu.Popover` or `Menu.Group`
   * components.
   *
   * It can optionally contain one instance of the `Menu.ItemLabel` component
   * and one instance of the `Menu.ItemHelpText` component.
   */
  RadioItem: Object.assign(import_radio_item.RadioItem, {
    displayName: "Menu.RadioItem"
  }),
  /**
   * Renders a checkbox menu item inside the `Menu.Popover` or `Menu.Group`
   * components.
   *
   * It can optionally contain one instance of the `Menu.ItemLabel` component
   * and one instance of the `Menu.ItemHelpText` component.
   */
  CheckboxItem: Object.assign(import_checkbox_item.CheckboxItem, {
    displayName: "Menu.CheckboxItem"
  }),
  /**
   * Renders a group for menu items.
   *
   * It should contain one instance of `Menu.GroupLabel` and one or more
   * instances of `Menu.Item`, `Menu.RadioItem`, or `Menu.CheckboxItem`.
   */
  Group: Object.assign(import_group.Group, {
    displayName: "Menu.Group"
  }),
  /**
   * Renders a label in a menu group.
   *
   * This component should be wrapped with `Menu.Group` so the
   * `aria-labelledby` is correctly set on the group element.
   */
  GroupLabel: Object.assign(import_group_label.GroupLabel, {
    displayName: "Menu.GroupLabel"
  }),
  /**
   * Renders a divider between menu items or menu groups.
   */
  Separator: Object.assign(import_separator.Separator, {
    displayName: "Menu.Separator"
  }),
  /**
   * Renders a menu item's label text. It should be wrapped with `Menu.Item`,
   * `Menu.RadioItem`, or `Menu.CheckboxItem`.
   */
  ItemLabel: Object.assign(import_item_label.ItemLabel, {
    displayName: "Menu.ItemLabel"
  }),
  /**
   * Renders a menu item's help text. It should be wrapped with `Menu.Item`,
   * `Menu.RadioItem`, or `Menu.CheckboxItem`.
   */
  ItemHelpText: Object.assign(import_item_help_text.ItemHelpText, {
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
  Popover: Object.assign(import_popover.Popover, {
    displayName: "Menu.Popover"
  }),
  /**
   * Renders a menu button that toggles the visibility of a sibling
   * `Menu.Popover` component when clicked or when using arrow keys.
   */
  TriggerButton: Object.assign(import_trigger_button.TriggerButton, {
    displayName: "Menu.TriggerButton"
  }),
  /**
   * Renders a menu item that toggles the visibility of a sibling
   * `Menu.Popover` component when clicked or when using arrow keys.
   *
   * This component is used to create a nested dropdown menu.
   */
  SubmenuTriggerItem: Object.assign(import_submenu_trigger_item.SubmenuTriggerItem, {
    displayName: "Menu.SubmenuTriggerItem"
  })
});
var menu_default = Menu;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Menu
});
//# sourceMappingURL=index.cjs.map
