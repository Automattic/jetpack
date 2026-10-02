"use client";
import { CompositeContextProvider, CompositeScopedContextProvider } from "../composite/composite-context.js";
import { createStoreContext } from "@ariakit/react-utils";
import { createContext } from "react";
//#region src/tag/tag-context.tsx
const TagValueContext = createContext(null);
const TagRemoveIdContext = createContext(null);
const ctx = createStoreContext([CompositeContextProvider], [CompositeScopedContextProvider]);
/**
* Returns the tag store from the nearest tag container.
* @example
* function Tag() {
*   const store = useTagContext();
*
*   if (!store) {
*     throw new Error("Tag must be wrapped in TagProvider");
*   }
*
*   // Use the store...
* }
*/
const useTagContext = ctx.useContext;
const useTagScopedContext = ctx.useScopedContext;
const useTagProviderContext = ctx.useProviderContext;
const TagContextProvider = ctx.ContextProvider;
const TagScopedContextProvider = ctx.ScopedContextProvider;
//#endregion
export { TagContextProvider, TagRemoveIdContext, TagScopedContextProvider, TagValueContext, useTagContext, useTagProviderContext, useTagScopedContext };

//# sourceMappingURL=tag-context.js.map