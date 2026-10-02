"use client";
import { DisclosureContextProvider, DisclosureScopedContextProvider } from "../disclosure/disclosure-context.js";
import { createStoreContext } from "@ariakit/react-utils";
import { createContext } from "react";
//#region src/dialog/dialog-context.tsx
const ctx = createStoreContext([DisclosureContextProvider], [DisclosureScopedContextProvider]);
/**
* Returns the dialog store from the nearest dialog container.
* @example
* function Dialog() {
*   const store = useDialogContext();
*
*   if (!store) {
*     throw new Error("Dialog must be wrapped in DialogProvider");
*   }
*
*   // Use the store...
* }
*/
const useDialogContext = ctx.useContext;
const useDialogScopedContext = ctx.useScopedContext;
const useDialogProviderContext = ctx.useProviderContext;
const DialogContextProvider = ctx.ContextProvider;
const DialogScopedContextProvider = ctx.ScopedContextProvider;
const DialogHeadingContext = createContext(void 0);
const DialogDescriptionContext = createContext(void 0);
//#endregion
export { DialogContextProvider, DialogDescriptionContext, DialogHeadingContext, DialogScopedContextProvider, useDialogContext, useDialogProviderContext, useDialogScopedContext };

//# sourceMappingURL=dialog-context.js.map