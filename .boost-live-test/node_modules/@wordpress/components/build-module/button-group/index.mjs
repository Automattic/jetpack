// packages/components/src/button-group/index.tsx
import clsx from "clsx";
import { forwardRef } from "@wordpress/element";
import deprecated from "@wordpress/deprecated";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedButtonGroup(props, ref) {
  const {
    className,
    __shouldNotWarnDeprecated,
    ...restProps
  } = props;
  const classes = clsx("components-button-group", className);
  if (!__shouldNotWarnDeprecated) {
    deprecated("wp.components.ButtonGroup", {
      since: "6.8",
      alternative: "wp.components.__experimentalToggleGroupControl"
    });
  }
  return /* @__PURE__ */ _jsx("div", {
    ref,
    role: "group",
    className: classes,
    ...restProps
  });
}
var ButtonGroup = forwardRef(UnforwardedButtonGroup);
ButtonGroup.displayName = "ButtonGroup";
var button_group_default = ButtonGroup;
export {
  ButtonGroup,
  button_group_default as default
};
//# sourceMappingURL=index.mjs.map
