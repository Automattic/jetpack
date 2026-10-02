// packages/components/src/tabs/context.ts
import { createContext, useContext } from "@wordpress/element";
var TabsContext = createContext(void 0);
TabsContext.displayName = "TabsContext";
var useTabsContext = () => useContext(TabsContext);
export {
  TabsContext,
  useTabsContext
};
//# sourceMappingURL=context.mjs.map
