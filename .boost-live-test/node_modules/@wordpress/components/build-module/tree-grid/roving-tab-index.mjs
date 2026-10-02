// packages/components/src/tree-grid/roving-tab-index.tsx
import { useState, useMemo } from "@wordpress/element";
import { RovingTabIndexProvider } from "./roving-tab-index-context.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function RovingTabIndex({
  children
}) {
  const [lastFocusedElement, setLastFocusedElement] = useState();
  const providerValue = useMemo(() => ({
    lastFocusedElement,
    setLastFocusedElement
  }), [lastFocusedElement]);
  return /* @__PURE__ */ _jsx(RovingTabIndexProvider, {
    value: providerValue,
    children
  });
}
export {
  RovingTabIndex as default
};
//# sourceMappingURL=roving-tab-index.mjs.map
