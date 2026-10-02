'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const DialogRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DialogRootContext.displayName = "DialogRootContext";
export function useDialogRootContext(optional) {
  const store = React.useContext(DialogRootContext);
  if (!optional && store === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: DialogRootContext is missing. Dialog parts must be placed within <Dialog.Root>.' : _formatErrorMessage(27));
  }
  return store;
}