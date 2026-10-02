// packages/components/src/toolbar/toolbar-button/index.tsx
import clsx from "clsx";
import { useContext, forwardRef } from "@wordpress/element";
import Button from "../../button/index.mjs";
import ToolbarItem from "../toolbar-item/index.mjs";
import ToolbarContext from "../toolbar-context/index.mjs";
import ToolbarButtonContainer from "./toolbar-button-container.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
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
  const accessibleToolbarState = useContext(ToolbarContext);
  if (!accessibleToolbarState) {
    return /* @__PURE__ */ _jsx(ToolbarButtonContainer, {
      className: containerClassName,
      children: /* @__PURE__ */ _jsx(Button, {
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
        className: clsx("components-toolbar__control", className),
        isPressed: isActive,
        accessibleWhenDisabled: true,
        "data-toolbar-item": true,
        ...extraProps,
        ...restProps,
        children
      })
    });
  }
  return /* @__PURE__ */ _jsx(ToolbarItem, {
    className: clsx("components-toolbar-button", className),
    ...extraProps,
    ...restProps,
    ref,
    children: (toolbarItemProps) => /* @__PURE__ */ _jsx(Button, {
      size: "compact",
      label: title,
      isPressed: isActive,
      ...toolbarItemProps,
      children
    })
  });
}
var ToolbarButton = forwardRef(UnforwardedToolbarButton);
ToolbarButton.displayName = "ToolbarButton";
var toolbar_button_default = ToolbarButton;
export {
  ToolbarButton,
  toolbar_button_default as default
};
//# sourceMappingURL=index.mjs.map
