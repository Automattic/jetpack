// packages/components/src/toggle-control/index.tsx
import clsx from "clsx";
import { forwardRef } from "@wordpress/element";
import { useInstanceId } from "@wordpress/compose";
import { FlexBlock } from "../flex/index.mjs";
import FormToggle from "../form-toggle/index.mjs";
import BaseControl from "../base-control/index.mjs";
import { HStack } from "../h-stack/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function UnforwardedToggleControl({
  label,
  checked,
  help,
  className,
  onChange,
  disabled,
  // Prevent passing to internal component.
  __nextHasNoMarginBottom: _,
  ...additionalProps
}, ref) {
  function onChangeToggle(event) {
    onChange(event.target.checked);
  }
  const instanceId = useInstanceId(ToggleControl);
  const id = `inspector-toggle-control-${instanceId}`;
  let describedBy, helpLabel;
  if (help) {
    if (typeof help === "function") {
      if (checked !== void 0) {
        helpLabel = help(checked);
      }
    } else {
      helpLabel = help;
    }
    if (helpLabel) {
      describedBy = id + "__help";
    }
  }
  return /* @__PURE__ */ _jsx(BaseControl, {
    id,
    help: helpLabel && /* @__PURE__ */ _jsx("span", {
      className: "components-toggle-control__help",
      children: helpLabel
    }),
    className: clsx("components-toggle-control", className),
    children: /* @__PURE__ */ _jsxs(HStack, {
      justify: "flex-start",
      spacing: 2,
      children: [/* @__PURE__ */ _jsx(FormToggle, {
        id,
        checked,
        onChange: onChangeToggle,
        "aria-describedby": describedBy,
        disabled,
        ref,
        ...additionalProps
      }), /* @__PURE__ */ _jsx(FlexBlock, {
        as: "label",
        htmlFor: id,
        className: clsx("components-toggle-control__label", {
          "is-disabled": disabled
        }),
        children: label
      })]
    })
  });
}
var ToggleControl = forwardRef(UnforwardedToggleControl);
ToggleControl.displayName = "ToggleControl";
var toggle_control_default = ToggleControl;
export {
  ToggleControl,
  toggle_control_default as default
};
//# sourceMappingURL=index.mjs.map
