"use client";
import { createStoreContext } from "@ariakit/react-utils";
//#region src/checkbox/checkbox-context.tsx
const ctx = createStoreContext();
/**
* Returns the checkbox store from the nearest checkbox container.
* @example
* function Checkbox() {
*   const store = useCheckboxContext();
*
*   if (!store) {
*     throw new Error("Checkbox must be wrapped in CheckboxProvider");
*   }
*
*   // Use the store...
* }
*/
const useCheckboxContext = ctx.useContext;
const useCheckboxScopedContext = ctx.useScopedContext;
const useCheckboxProviderContext = ctx.useProviderContext;
const CheckboxContextProvider = ctx.ContextProvider;
const CheckboxScopedContextProvider = ctx.ScopedContextProvider;
//#endregion
export { CheckboxContextProvider, CheckboxScopedContextProvider, useCheckboxContext, useCheckboxProviderContext, useCheckboxScopedContext };

//# sourceMappingURL=checkbox-context.js.map