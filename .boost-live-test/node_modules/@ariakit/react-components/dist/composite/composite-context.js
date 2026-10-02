"use client";
import { CollectionContextProvider, CollectionScopedContextProvider } from "../collection/collection-context.js";
import { createStoreContext } from "@ariakit/react-utils";
import { createContext } from "react";
//#region src/composite/composite-context.tsx
const ctx = createStoreContext([CollectionContextProvider], [CollectionScopedContextProvider]);
/**
* Returns the composite store from the nearest composite container.
* @example
* function CompositeItem() {
*   const store = useCompositeContext();
*
*   if (!store) {
*     throw new Error("CompositeItem must be wrapped in CompositeProvider");
*   }
*
*   // Use the store...
* }
*/
const useCompositeContext = ctx.useContext;
const useCompositeScopedContext = ctx.useScopedContext;
const useCompositeProviderContext = ctx.useProviderContext;
const CompositeContextProvider = ctx.ContextProvider;
const CompositeScopedContextProvider = ctx.ScopedContextProvider;
const CompositeItemContext = createContext(void 0);
const CompositeRowContext = createContext(void 0);
//#endregion
export { CompositeContextProvider, CompositeItemContext, CompositeRowContext, CompositeScopedContextProvider, useCompositeContext, useCompositeProviderContext, useCompositeScopedContext };

//# sourceMappingURL=composite-context.js.map