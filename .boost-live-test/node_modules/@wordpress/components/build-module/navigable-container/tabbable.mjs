// packages/components/src/navigable-container/tabbable.tsx
import { forwardRef } from "@wordpress/element";
import NavigableContainer from "./container.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedTabbableContainer({
  eventToOffset,
  ...props
}, ref) {
  const innerEventToOffset = (evt) => {
    const {
      code,
      shiftKey
    } = evt;
    if ("Tab" === code) {
      return shiftKey ? -1 : 1;
    }
    if (eventToOffset) {
      return eventToOffset(evt);
    }
    return void 0;
  };
  return /* @__PURE__ */ _jsx(NavigableContainer, {
    ref,
    stopNavigationEvents: true,
    onlyBrowserTabstops: true,
    eventToOffset: innerEventToOffset,
    ...props
  });
}
var TabbableContainer = forwardRef(UnforwardedTabbableContainer);
TabbableContainer.displayName = "TabbableContainer";
var tabbable_default = TabbableContainer;
export {
  TabbableContainer,
  UnforwardedTabbableContainer,
  tabbable_default as default
};
//# sourceMappingURL=tabbable.mjs.map
