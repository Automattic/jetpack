// packages/components/src/tools-panel/context.ts
import { createContext, useContext } from "@wordpress/element";
var noop = () => void 0;
var ToolsPanelContext = createContext({
  menuItems: {
    default: {},
    optional: {}
  },
  hasMenuItems: false,
  isResetting: false,
  shouldRenderPlaceholderItems: false,
  registerPanelItem: noop,
  deregisterPanelItem: noop,
  flagItemCustomization: noop,
  registerResetAllFilter: noop,
  deregisterResetAllFilter: noop,
  areAllOptionalControlsHidden: true
});
ToolsPanelContext.displayName = "ToolsPanelContext";
var useToolsPanelContext = () => useContext(ToolsPanelContext);
export {
  ToolsPanelContext,
  useToolsPanelContext
};
//# sourceMappingURL=context.mjs.map
