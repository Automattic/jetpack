// packages/components/src/circular-option-picker/circular-option-picker-actions.tsx
import clsx from "clsx";
import Button from "../button/index.mjs";
import Dropdown from "../dropdown/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function DropdownLinkAction({
  buttonProps,
  className,
  dropdownProps,
  linkText
}) {
  return /* @__PURE__ */ _jsx(Dropdown, {
    className: clsx("components-circular-option-picker__dropdown-link-action", className),
    renderToggle: ({
      isOpen,
      onToggle
    }) => /* @__PURE__ */ _jsx(Button, {
      "aria-expanded": isOpen,
      "aria-haspopup": "true",
      onClick: onToggle,
      variant: "link",
      ...buttonProps,
      children: linkText
    }),
    ...dropdownProps
  });
}
function ButtonAction({
  className,
  children,
  ...additionalProps
}) {
  return /* @__PURE__ */ _jsx(Button, {
    __next40pxDefaultSize: true,
    className: clsx("components-circular-option-picker__clear", className),
    variant: "tertiary",
    ...additionalProps,
    children
  });
}
export {
  ButtonAction,
  DropdownLinkAction
};
//# sourceMappingURL=circular-option-picker-actions.mjs.map
