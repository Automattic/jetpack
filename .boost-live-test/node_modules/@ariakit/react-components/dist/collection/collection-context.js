"use client";
import { createStoreContext } from "@ariakit/react-utils";
//#region src/collection/collection-context.tsx
const ctx = createStoreContext();
/**
* Returns the collection store from the nearest collection container.
* @example
* function CollectionItem() {
*   const store = useCollectionContext();
*
*   if (!store) {
*     throw new Error("CollectionItem must be wrapped in CollectionProvider");
*   }
*
*   // Use the store...
* }
*/
const useCollectionContext = ctx.useContext;
const useCollectionScopedContext = ctx.useScopedContext;
const useCollectionProviderContext = ctx.useProviderContext;
const CollectionContextProvider = ctx.ContextProvider;
const CollectionScopedContextProvider = ctx.ScopedContextProvider;
//#endregion
export { CollectionContextProvider, CollectionScopedContextProvider, useCollectionContext, useCollectionProviderContext, useCollectionScopedContext };

//# sourceMappingURL=collection-context.js.map