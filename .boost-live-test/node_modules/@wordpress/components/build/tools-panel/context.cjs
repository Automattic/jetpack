"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/tools-panel/context.ts
var context_exports = {};
__export(context_exports, {
  ToolsPanelContext: () => ToolsPanelContext,
  useToolsPanelContext: () => useToolsPanelContext
});
module.exports = __toCommonJS(context_exports);
var import_element = require("@wordpress/element");
var noop = () => void 0;
var ToolsPanelContext = (0, import_element.createContext)({
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
var useToolsPanelContext = () => (0, import_element.useContext)(ToolsPanelContext);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToolsPanelContext,
  useToolsPanelContext
});
//# sourceMappingURL=context.cjs.map
