// packages/components/src/radio-group/index.tsx
import * as Ariakit from "@ariakit/react";
import deprecated from "@wordpress/deprecated";
import { useMemo, forwardRef } from "@wordpress/element";
import { isRTL } from "@wordpress/i18n";
import ButtonGroup from "../button-group/index.mjs";
import { RadioGroupContext } from "./context.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedRadioGroup({
  label,
  checked,
  defaultChecked,
  disabled,
  onChange,
  children,
  ...props
}, ref) {
  const radioStore = Ariakit.useRadioStore({
    value: checked,
    defaultValue: defaultChecked,
    setValue: (newValue) => {
      onChange?.(newValue ?? void 0);
    },
    rtl: isRTL()
  });
  const contextValue = useMemo(() => ({
    store: radioStore,
    disabled
  }), [radioStore, disabled]);
  deprecated("wp.components.__experimentalRadioGroup", {
    alternative: "wp.components.RadioControl or wp.components.__experimentalToggleGroupControl",
    since: "6.8"
  });
  return /* @__PURE__ */ _jsx(RadioGroupContext.Provider, {
    value: contextValue,
    children: /* @__PURE__ */ _jsx(Ariakit.RadioGroup, {
      store: radioStore,
      render: /* @__PURE__ */ _jsx(ButtonGroup, {
        __shouldNotWarnDeprecated: true,
        children
      }),
      "aria-label": label,
      ref,
      ...props
    })
  });
}
var RadioGroup2 = forwardRef(UnforwardedRadioGroup);
RadioGroup2.displayName = "RadioGroup";
var radio_group_default = RadioGroup2;
export {
  RadioGroup2 as RadioGroup,
  radio_group_default as default
};
//# sourceMappingURL=index.mjs.map
