// packages/components/src/menu-item/index.tsx
import clsx from "clsx";
import { cloneElement, forwardRef } from "@wordpress/element";
import Shortcut from "../shortcut/index.mjs";
import Button from "../button/index.mjs";
import Icon from "../icon/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
  className = clsx("components-menu-item__button", className);
  if (info) {
    children = /* @__PURE__ */ _jsxs("span", {
      className: "components-menu-item__info-wrapper",
      children: [/* @__PURE__ */ _jsx("span", {
        className: "components-menu-item__item",
        children
      }), /* @__PURE__ */ _jsx("span", {
        className: "components-menu-item__info",
        children: info
      })]
    });
  }
  if (icon && typeof icon !== "string") {
    icon = cloneElement(icon, {
      className: clsx("components-menu-items__item-icon", {
        "has-icon-right": iconPosition === "right"
      })
    });
  }
  return /* @__PURE__ */ _jsxs(Button, {
    size: "compact",
    ref,
    "aria-checked": role === "menuitemcheckbox" || role === "menuitemradio" ? isSelected : void 0,
    role,
    icon: iconPosition === "left" ? icon : void 0,
    className,
    accessibleWhenDisabled: true,
    ...buttonProps,
    children: [/* @__PURE__ */ _jsx("span", {
      className: "components-menu-item__item",
      children
    }), !suffix && /* @__PURE__ */ _jsx(Shortcut, {
      className: "components-menu-item__shortcut",
      shortcut
    }), !suffix && icon && iconPosition === "right" && /* @__PURE__ */ _jsx(Icon, {
      icon
    }), suffix]
  });
}
var MenuItem = forwardRef(UnforwardedMenuItem);
MenuItem.displayName = "MenuItem";
var menu_item_default = MenuItem;
export {
  MenuItem,
  menu_item_default as default
};
//# sourceMappingURL=index.mjs.map
