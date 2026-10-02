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

// packages/components/src/toolbar/toolbar-button/index.tsx
var toolbar_button_exports = {};
__export(toolbar_button_exports, {
  ToolbarButton: () => ToolbarButton,
  default: () => toolbar_button_default
});
module.exports = __toCommonJS(toolbar_button_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_button = __toESM(require("../../button/index.cjs"));
var import_toolbar_item = __toESM(require("../toolbar-item/index.cjs"));
var import_toolbar_context = __toESM(require("../toolbar-context/index.cjs"));
var import_toolbar_button_container = __toESM(require("./toolbar-button-container.cjs"));
var import_jsx_runtime = require("react/jsx-runtime");
function useDeprecatedProps({
  isDisabled,
  ...otherProps
}) {
  return {
    disabled: isDisabled,
    ...otherProps
  };
}
function UnforwardedToolbarButton(props, ref) {
  const {
    children,
    className,
    containerClassName,
    extraProps,
    isActive,
    title,
    ...restProps
  } = useDeprecatedProps(props);
  const accessibleToolbarState = (0, import_element.useContext)(import_toolbar_context.default);
  if (!accessibleToolbarState) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_toolbar_button_container.default, {
      className: containerClassName,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
        ref,
        icon: restProps.icon,
        size: "compact",
        label: title,
        shortcut: restProps.shortcut,
        "data-subscript": restProps.subscript,
        onClick: (event) => {
          event.stopPropagation();
          if (restProps.onClick) {
            restProps.onClick(event);
          }
        },
        className: (0, import_clsx.default)("components-toolbar__control", className),
        isPressed: isActive,
        accessibleWhenDisabled: true,
        "data-toolbar-item": true,
        ...extraProps,
        ...restProps,
        children
      })
    });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_toolbar_item.default, {
    className: (0, import_clsx.default)("components-toolbar-button", className),
    ...extraProps,
    ...restProps,
    ref,
    children: (toolbarItemProps) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_button.default, {
      size: "compact",
      label: title,
      isPressed: isActive,
      ...toolbarItemProps,
      children
    })
  });
}
var ToolbarButton = (0, import_element.forwardRef)(UnforwardedToolbarButton);
ToolbarButton.displayName = "ToolbarButton";
var toolbar_button_default = ToolbarButton;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToolbarButton
});
//# sourceMappingURL=index.cjs.map
