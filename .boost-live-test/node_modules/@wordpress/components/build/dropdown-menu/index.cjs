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

// packages/components/src/dropdown-menu/index.tsx
var dropdown_menu_exports = {};
__export(dropdown_menu_exports, {
  DropdownMenu: () => DropdownMenu,
  default: () => dropdown_menu_default
});
module.exports = __toCommonJS(dropdown_menu_exports);
var import_clsx = __toESM(require("clsx"));
var import_icons = require("@wordpress/icons");
var import_context = require("../context/index.cjs");
var import_button = __toESM(require("../button/index.cjs"));
var import_dropdown = __toESM(require("../dropdown/index.cjs"));
var import_navigable_container = require("../navigable-container/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
function mergeProps(defaultProps = {}, props = {}) {
  const mergedProps = {
    ...defaultProps,
    ...props
  };
  if (props.className && defaultProps.className) {
    mergedProps.className = (0, import_clsx.default)(props.className, defaultProps.className);
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
    icon = import_icons.menu,
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
  } = (0, import_context.useContextSystem)(dropdownMenuProps, "DropdownMenu");
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dropdown.default, {
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
        as: Toggle = import_button.default,
        ...restToggleProps
      } = toggleProps ?? {};
      const mergedToggleProps = mergeProps({
        className: (0, import_clsx.default)("components-dropdown-menu__toggle", {
          "is-opened": isOpen
        })
      }, restToggleProps);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
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
        className: (0, import_clsx.default)("components-dropdown-menu__menu", {
          "no-icons": noIcons
        })
      }, menuProps);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_navigable_container.NavigableMenu, {
        ...mergedMenuProps,
        role: "menu",
        children: [isFunction(children) ? children(props) : null, controlSets?.flatMap((controlSet, indexOfSet) => controlSet.map((control, indexOfControl) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
          size: "compact",
          onClick: (event) => {
            event.stopPropagation();
            props.onClose();
            if (control.onClick) {
              control.onClick();
            }
          },
          className: (0, import_clsx.default)("components-dropdown-menu__menu-item", {
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
var DropdownMenu = (0, import_context.contextConnectWithoutRef)(UnconnectedDropdownMenu, "DropdownMenu");
var dropdown_menu_default = DropdownMenu;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DropdownMenu
});
//# sourceMappingURL=index.cjs.map
