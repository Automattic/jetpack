"use client";
import { HovercardContextProvider, HovercardScopedContextProvider } from "../hovercard/hovercard-context.js";
import { createStoreContext } from "@ariakit/react-utils";
//#region src/tooltip/tooltip-context.tsx
const ctx = createStoreContext([HovercardContextProvider], [HovercardScopedContextProvider]);
/**
* Returns the tooltip store from the nearest tooltip container.
* @example
* function Tooltip() {
*   const store = useTooltipContext();
*
*   if (!store) {
*     throw new Error("Tooltip must be wrapped in TooltipProvider");
*   }
*
*   // Use the store...
* }
*/
const useTooltipContext = ctx.useContext;
const useTooltipScopedContext = ctx.useScopedContext;
const useTooltipProviderContext = ctx.useProviderContext;
const TooltipContextProvider = ctx.ContextProvider;
const TooltipScopedContextProvider = ctx.ScopedContextProvider;
//#endregion
export { TooltipContextProvider, TooltipScopedContextProvider, useTooltipContext, useTooltipProviderContext, useTooltipScopedContext };

//# sourceMappingURL=tooltip-context.js.map