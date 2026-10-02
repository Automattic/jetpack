"use client";
import { CompositeContextProvider, CompositeScopedContextProvider } from "../composite/composite-context.js";
import { createStoreContext } from "@ariakit/react-utils";
//#region src/menubar/menubar-context.tsx
const menubar = createStoreContext([CompositeContextProvider], [CompositeScopedContextProvider]);
/**
* Returns the menubar store from the nearest menubar container.
* @example
* function Menubar() {
*   const store = useMenubarContext();
*
*   if (!store) {
*     throw new Error("Menubar must be wrapped in MenubarProvider");
*   }
*
*   // Use the store...
* }
*/
const useMenubarContext = menubar.useContext;
const useMenubarScopedContext = menubar.useScopedContext;
const useMenubarProviderContext = menubar.useProviderContext;
const MenubarContextProvider = menubar.ContextProvider;
const MenubarScopedContextProvider = menubar.ScopedContextProvider;
//#endregion
export { MenubarContextProvider, MenubarScopedContextProvider, useMenubarContext, useMenubarProviderContext, useMenubarScopedContext };

//# sourceMappingURL=menubar-context.js.map