// packages/components/src/border-box-control/border-box-control-linked-button/component.tsx
import { link, linkOff } from "@wordpress/icons";
import { __ } from "@wordpress/i18n";
import Button from "../../button/index.mjs";
import { contextConnect } from "../../context/index.mjs";
import { useBorderBoxControlLinkedButton } from "./hook.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var BorderBoxControlLinkedButton = (props, forwardedRef) => {
  const {
    className,
    isLinked,
    ...buttonProps
  } = useBorderBoxControlLinkedButton(props);
  const label = isLinked ? __("Unlink sides") : __("Link sides");
  return /* @__PURE__ */ _jsx(Button, {
    ...buttonProps,
    size: "small",
    icon: isLinked ? link : linkOff,
    iconSize: 24,
    label,
    ref: forwardedRef,
    className
  });
};
var ConnectedBorderBoxControlLinkedButton = contextConnect(BorderBoxControlLinkedButton, "BorderBoxControlLinkedButton");
var component_default = ConnectedBorderBoxControlLinkedButton;
export {
  component_default as default
};
//# sourceMappingURL=component.mjs.map
