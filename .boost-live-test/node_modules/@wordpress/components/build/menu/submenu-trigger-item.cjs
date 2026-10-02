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

// packages/components/src/menu/submenu-trigger-item.tsx
var submenu_trigger_item_exports = {};
__export(submenu_trigger_item_exports, {
  SubmenuTriggerItem: () => SubmenuTriggerItem
});
module.exports = __toCommonJS(submenu_trigger_item_exports);
var Ariakit = __toESM(require("@ariakit/react"));
var import_element = require("@wordpress/element");
var import_icons = require("@wordpress/icons");
var import_context = require("./context.cjs");
var import_item = require("./item.cjs");
var Styled = __toESM(require("./styles.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
var SubmenuTriggerItem = (0, import_element.forwardRef)(function SubmenuTriggerItem2({
  suffix,
  ...otherProps
}, ref) {
  const menuContext = (0, import_element.useContext)(import_context.Context);
  if (!menuContext?.store.parent) {
    throw new Error("Menu.SubmenuTriggerItem can only be rendered inside a nested Menu component");
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ariakit.MenuButton, {
    ref,
    accessibleWhenDisabled: true,
    store: menuContext.store,
    render: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_item.Item, {
      ...otherProps,
      // The menu item needs to register and be part of the parent menu.
      // Without specifying the store explicitly, the `Item` component
      // would otherwise read the store via context and pick up the one from
      // the sub-menu `Menu` component.
      store: menuContext.store.parent,
      suffix: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, {
        children: [suffix, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Styled.SubmenuChevronIcon, {
          "aria-hidden": "true",
          icon: import_icons.chevronRightSmall,
          size: 24,
          preserveAspectRatio: "xMidYMid slice"
        })]
      })
    })
  });
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SubmenuTriggerItem
});
//# sourceMappingURL=submenu-trigger-item.cjs.map
