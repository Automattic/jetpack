// packages/components/src/tree-grid/roving-tab-index-context.ts
import { createContext, useContext } from "@wordpress/element";
var RovingTabIndexContext = createContext(void 0);
RovingTabIndexContext.displayName = "RovingTabIndexContext";
var useRovingTabIndexContext = () => useContext(RovingTabIndexContext);
var RovingTabIndexProvider = RovingTabIndexContext.Provider;
export {
  RovingTabIndexProvider,
  useRovingTabIndexContext
};
//# sourceMappingURL=roving-tab-index-context.mjs.map
