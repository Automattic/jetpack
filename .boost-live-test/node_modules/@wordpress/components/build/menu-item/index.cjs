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

// packages/components/src/menu-item/index.tsx
var menu_item_exports = {};
__export(menu_item_exports, {
  MenuItem: () => MenuItem,
  default: () => menu_item_default
});
module.exports = __toCommonJS(menu_item_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_shortcut = __toESM(require("../shortcut/index.cjs"));
var import_button = __toESM(require("../button/index.cjs"));
var import_icon = __toESM(require("../icon/index.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function UnforwardedMenuItem(props, ref) {
  let {
    children,
    info,
    className,
    icon,
    iconPosition = "right",
    shortcut,
    isSelected,
    role = "menuitem",
    suffix,
    ...buttonProps
  } = props;
  className = (0, import_clsx.default)("components-menu-item__button", className);
  if (info) {
    children = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
      className: "components-menu-item__info-wrapper",
      children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
        className: "components-menu-item__item",
        children
      }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
        className: "components-menu-item__info",
        children: info
      })]
    });
  }
  if (icon && typeof icon !== "string") {
    icon = (0, import_element.cloneElement)(icon, {
      className: (0, import_clsx.default)("components-menu-items__item-icon", {
        "has-icon-right": iconPosition === "right"
      })
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_button.default, {
    size: "compact",
    ref,
    "aria-checked": role === "menuitemcheckbox" || role === "menuitemradio" ? isSelected : void 0,
    role,
    icon: iconPosition === "left" ? icon : void 0,
    className,
    accessibleWhenDisabled: true,
    ...buttonProps,
    children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
      className: "components-menu-item__item",
      children
    }), !suffix && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_shortcut.default, {
      className: "components-menu-item__shortcut",
      shortcut
    }), !suffix && icon && iconPosition === "right" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_icon.default, {
      icon
    }), suffix]
  });
}
var MenuItem = (0, import_element.forwardRef)(UnforwardedMenuItem);
MenuItem.displayName = "MenuItem";
var menu_item_default = MenuItem;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MenuItem
});
//# sourceMappingURL=index.cjs.map
