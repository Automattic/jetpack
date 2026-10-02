// packages/components/src/tools-panel/tools-panel-item/component.tsx
import { useToolsPanelItem } from "./hook.mjs";
import { View } from "../../view/index.mjs";
import { contextConnect } from "../../context/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var UnconnectedToolsPanelItem = (props, forwardedRef) => {
  const {
    children,
    isShown,
    shouldRenderPlaceholder,
    ...toolsPanelItemProps
  } = useToolsPanelItem(props);
  if (!isShown) {
    return shouldRenderPlaceholder ? /* @__PURE__ */ _jsx(View, {
      ...toolsPanelItemProps,
      ref: forwardedRef
    }) : null;
  }
  return /* @__PURE__ */ _jsx(View, {
    ...toolsPanelItemProps,
    ref: forwardedRef,
    children
  });
};
var ToolsPanelItem = contextConnect(UnconnectedToolsPanelItem, "ToolsPanelItem");
var component_default = ToolsPanelItem;
export {
  ToolsPanelItem,
  component_default as default
};
//# sourceMappingURL=component.mjs.map
