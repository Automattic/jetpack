"use client";
import { CompositeContextProvider, CompositeScopedContextProvider } from "../composite/composite-context.js";
import { createStoreContext } from "@ariakit/react-utils";
//#region src/toolbar/toolbar-context.tsx
const ctx = createStoreContext([CompositeContextProvider], [CompositeScopedContextProvider]);
/**
* Returns the toolbar store from the nearest toolbar container.
* @example
* function ToolbarItem() {
*   const store = useToolbarContext();
*
*   if (!store) {
*     throw new Error("ToolbarItem must be wrapped in ToolbarProvider");
*   }
*
*   // Use the store...
* }
*/
const useToolbarContext = ctx.useContext;
const useToolbarScopedContext = ctx.useScopedContext;
const useToolbarProviderContext = ctx.useProviderContext;
const ToolbarContextProvider = ctx.ContextProvider;
const ToolbarScopedContextProvider = ctx.ScopedContextProvider;
//#endregion
export { ToolbarContextProvider, ToolbarScopedContextProvider, useToolbarContext, useToolbarProviderContext, useToolbarScopedContext };

//# sourceMappingURL=toolbar-context.js.map