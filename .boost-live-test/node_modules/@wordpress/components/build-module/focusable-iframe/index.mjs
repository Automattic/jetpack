// packages/components/src/focusable-iframe/index.tsx
import { useMergeRefs, useFocusableIframe } from "@wordpress/compose";
import deprecated from "@wordpress/deprecated";
import { jsx as _jsx } from "react/jsx-runtime";
function FocusableIframe({
  iframeRef,
  ...props
}) {
  const ref = useMergeRefs([iframeRef, useFocusableIframe()]);
  deprecated("wp.components.FocusableIframe", {
    since: "5.9",
    alternative: "wp.compose.useFocusableIframe"
  });
  return /* @__PURE__ */ _jsx("iframe", {
    ref,
    ...props
  });
}
export {
  FocusableIframe as default
};
//# sourceMappingURL=index.mjs.map
