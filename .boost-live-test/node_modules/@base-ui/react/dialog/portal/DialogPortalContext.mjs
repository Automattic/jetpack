'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const DialogPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DialogPortalContext.displayName = "DialogPortalContext";
export function useDialogPortalContext() {
  const value = React.useContext(DialogPortalContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Dialog.Portal> is missing.' : _formatErrorMessage(26));
  }
  return value;
}