// packages/components/src/dropdown-menu/index.tsx
import clsx from "clsx";
import { menu } from "@wordpress/icons";
import { contextConnectWithoutRef, useContextSystem } from "../context/index.mjs";
import Button from "../button/index.mjs";
import Dropdown from "../dropdown/index.mjs";
import { NavigableMenu } from "../navigable-container/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function mergeProps(defaultProps = {}, props = {}) {
  const mergedProps = {
    ...defaultProps,
    ...props
  };
  if (props.className && defaultProps.className) {
    mergedProps.className = clsx(props.className, defaultProps.className);
  }
  return mergedProps;
}
function isFunction(maybeFunc) {
  return typeof maybeFunc === "function";
}
function UnconnectedDropdownMenu(dropdownMenuProps) {
  const {
    children,
    className,
    controls,
    icon = menu,
    label,
    popoverProps,
    toggleProps,
    menuProps,
    disableOpenOnArrowDown = false,
    text,
    noIcons,
    open,
    defaultOpen,
    onToggle: onToggleProp,
    // Context
    variant
  } = useContextSystem(dropdownMenuProps, "DropdownMenu");
  if (!controls?.length && !isFunction(children)) {
    return null;
  }
  let controlSets;
  if (controls?.length) {
    controlSets = controls;
    if (!Array.isArray(controlSets[0])) {
      controlSets = [controls];
    }
  }
  const mergedPopoverProps = mergeProps({
    className: "components-dropdown-menu__popover",
    variant
  }, popoverProps);
  return /* @__PURE__ */ _jsx(Dropdown, {
    className,
    popoverProps: mergedPopoverProps,
    renderToggle: ({
      isOpen,
      onToggle
    }) => {
      const openOnArrowDown = (event) => {
        if (disableOpenOnArrowDown) {
          return;
        }
        if (!isOpen && event.code === "ArrowDown") {
          event.preventDefault();
          onToggle();
        }
      };
      const {
        as: Toggle = Button,
        ...restToggleProps
      } = toggleProps ?? {};
      const mergedToggleProps = mergeProps({
        className: clsx("components-dropdown-menu__toggle", {
          "is-opened": isOpen
        })
      }, restToggleProps);
      return /* @__PURE__ */ _jsx(Toggle, {
        ...mergedToggleProps,
        icon,
        onClick: (event) => {
          onToggle();
          if (mergedToggleProps.onClick) {
            mergedToggleProps.onClick(event);
          }
        },
        onKeyDown: (event) => {
          openOnArrowDown(event);
          if (mergedToggleProps.onKeyDown) {
            mergedToggleProps.onKeyDown(event);
          }
        },
        "aria-haspopup": "true",
        "aria-expanded": isOpen,
        label,
        text,
        showTooltip: toggleProps?.showTooltip ?? true,
        children: mergedToggleProps.children
      });
    },
    renderContent: (props) => {
      const mergedMenuProps = mergeProps({
        "aria-label": label,
        className: clsx("components-dropdown-menu__menu", {
          "no-icons": noIcons
        })
      }, menuProps);
      return /* @__PURE__ */ _jsxs(NavigableMenu, {
        ...mergedMenuProps,
        role: "menu",
        children: [isFunction(children) ? children(props) : null, controlSets?.flatMap((controlSet, indexOfSet) => controlSet.map((control, indexOfControl) => /* @__PURE__ */ _jsx(Button, {
          size: "compact",
          onClick: (event) => {
            event.stopPropagation();
            props.onClose();
            if (control.onClick) {
              control.onClick();
            }
          },
          className: clsx("components-dropdown-menu__menu-item", {
            "has-separator": indexOfSet > 0 && indexOfControl === 0,
            "is-active": control.isActive,
            "is-icon-only": !control.title
          }),
          icon: control.icon,
          label: control.label,
          "aria-checked": control.role === "menuitemcheckbox" || control.role === "menuitemradio" ? control.isActive : void 0,
          role: control.role === "menuitemcheckbox" || control.role === "menuitemradio" ? control.role : "menuitem",
          accessibleWhenDisabled: true,
          disabled: control.isDisabled,
          children: control.title
        }, [indexOfSet, indexOfControl].join())))]
      });
    },
    open,
    defaultOpen,
    onToggle: onToggleProp
  });
}
var DropdownMenu = contextConnectWithoutRef(UnconnectedDropdownMenu, "DropdownMenu");
var dropdown_menu_default = DropdownMenu;
export {
  DropdownMenu,
  dropdown_menu_default as default
};
//# sourceMappingURL=index.mjs.map
