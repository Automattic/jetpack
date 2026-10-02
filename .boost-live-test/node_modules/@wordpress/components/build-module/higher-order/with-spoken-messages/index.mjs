// packages/components/src/higher-order/with-spoken-messages/index.tsx
import { createHigherOrderComponent, useDebounce } from "@wordpress/compose";
import { speak } from "@wordpress/a11y";
import { jsx as _jsx } from "react/jsx-runtime";
var with_spoken_messages_default = createHigherOrderComponent((Component) => function WithSpokenMessages(props) {
  return /* @__PURE__ */ _jsx(Component, {
    ...props,
    speak,
    debouncedSpeak: useDebounce(speak, 500)
  });
}, "withSpokenMessages");
export {
  with_spoken_messages_default as default
};
//# sourceMappingURL=index.mjs.map
