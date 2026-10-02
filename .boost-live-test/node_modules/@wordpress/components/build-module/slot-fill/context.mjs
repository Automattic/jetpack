// packages/components/src/slot-fill/context.ts
import { observableMap } from "@wordpress/compose";
import { createContext } from "@wordpress/element";
import warning from "@wordpress/warning";
var initialValue = {
  slots: observableMap(),
  fills: observableMap(),
  registerSlot: () => {
    globalThis.SCRIPT_DEBUG === true ? warning("Components must be wrapped within `SlotFillProvider`. See https://developer.wordpress.org/block-editor/components/slot-fill/") : void 0;
  },
  unregisterSlot: () => {
  },
  updateSlot: () => {
  },
  registerFill: () => {
  },
  unregisterFill: () => {
  },
  updateFill: () => {
  },
  // This helps the provider know if it's using the default context value or not.
  isDefault: true
};
var SlotFillContext = createContext(initialValue);
SlotFillContext.displayName = "SlotFillContext";
var context_default = SlotFillContext;
export {
  context_default as default
};
//# sourceMappingURL=context.mjs.map
