"use client";
import { CompositeContextProvider, CompositeScopedContextProvider } from "../composite/composite-context.js";
import { createStoreContext } from "@ariakit/react-utils";
//#region src/tab/tab-context.tsx
const ctx = createStoreContext([CompositeContextProvider], [CompositeScopedContextProvider]);
/**
* Returns the tab store from the nearest tab container.
* @example
* function Tab() {
*   const store = useTabContext();
*
*   if (!store) {
*     throw new Error("Tab must be wrapped in TabProvider");
*   }
*
*   // Use the store...
* }
*/
const useTabContext = ctx.useContext;
const useTabScopedContext = ctx.useScopedContext;
const useTabProviderContext = ctx.useProviderContext;
const TabContextProvider = ctx.ContextProvider;
const TabScopedContextProvider = ctx.ScopedContextProvider;
//#endregion
export { TabContextProvider, TabScopedContextProvider, useTabContext, useTabProviderContext, useTabScopedContext };

//# sourceMappingURL=tab-context.js.map