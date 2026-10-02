"use client";
import { createStoreContext } from "@ariakit/react-utils";
//#region src/disclosure/disclosure-context.tsx
const ctx = createStoreContext();
/**
* Returns the disclosure store from the nearest disclosure container.
* @example
* function Disclosure() {
*   const store = useDisclosureContext();
*
*   if (!store) {
*     throw new Error("Disclosure must be wrapped in DisclosureProvider");
*   }
*
*   // Use the store...
* }
*/
const useDisclosureContext = ctx.useContext;
const useDisclosureScopedContext = ctx.useScopedContext;
const useDisclosureProviderContext = ctx.useProviderContext;
const DisclosureContextProvider = ctx.ContextProvider;
const DisclosureScopedContextProvider = ctx.ScopedContextProvider;
//#endregion
export { DisclosureContextProvider, DisclosureScopedContextProvider, useDisclosureContext, useDisclosureProviderContext, useDisclosureScopedContext };

//# sourceMappingURL=disclosure-context.js.map