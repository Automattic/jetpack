"use client";
import { PopoverContextProvider, PopoverScopedContextProvider } from "../popover/popover-context.js";
import { createStoreContext } from "@ariakit/react-utils";
//#region src/hovercard/hovercard-context.tsx
const ctx = createStoreContext([PopoverContextProvider], [PopoverScopedContextProvider]);
/**
* Returns the hovercard store from the nearest hovercard container.
* @example
* function Hovercard() {
*   const store = useHovercardContext();
*
*   if (!store) {
*     throw new Error("Hovercard must be wrapped in HovercardProvider");
*   }
*
*   // Use the store...
* }
*/
const useHovercardContext = ctx.useContext;
const useHovercardScopedContext = ctx.useScopedContext;
const useHovercardProviderContext = ctx.useProviderContext;
const HovercardContextProvider = ctx.ContextProvider;
const HovercardScopedContextProvider = ctx.ScopedContextProvider;
//#endregion
export { HovercardContextProvider, HovercardScopedContextProvider, useHovercardContext, useHovercardProviderContext, useHovercardScopedContext };

//# sourceMappingURL=hovercard-context.js.map