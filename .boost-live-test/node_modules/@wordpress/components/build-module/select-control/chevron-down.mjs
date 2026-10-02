// packages/components/src/select-control/chevron-down.tsx
import { chevronDown, Icon } from "@wordpress/icons";
import { chevronIconSize, DownArrowWrapper, InputControlSuffixWrapperWithClickThrough } from "./styles/select-control-styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var SelectControlChevronDown = () => {
  return /* @__PURE__ */ _jsx(InputControlSuffixWrapperWithClickThrough, {
    children: /* @__PURE__ */ _jsx(DownArrowWrapper, {
      children: /* @__PURE__ */ _jsx(Icon, {
        icon: chevronDown,
        size: chevronIconSize
      })
    })
  });
};
var chevron_down_default = SelectControlChevronDown;
export {
  chevron_down_default as default
};
//# sourceMappingURL=chevron-down.mjs.map
