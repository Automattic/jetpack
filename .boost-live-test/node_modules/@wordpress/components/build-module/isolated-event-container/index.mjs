// packages/components/src/isolated-event-container/index.tsx
import { forwardRef } from "@wordpress/element";
import deprecated from "@wordpress/deprecated";
import { jsx as _jsx } from "react/jsx-runtime";
function stopPropagation(event) {
  event.stopPropagation();
}
var IsolatedEventContainer = forwardRef((props, ref) => {
  deprecated("wp.components.IsolatedEventContainer", {
    since: "5.7"
  });
  return /* @__PURE__ */ _jsx("div", {
    ...props,
    ref,
    onMouseDown: stopPropagation
  });
});
var isolated_event_container_default = IsolatedEventContainer;
export {
  isolated_event_container_default as default
};
//# sourceMappingURL=index.mjs.map
