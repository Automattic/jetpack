'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const ToastPositionerContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ToastPositionerContext.displayName = "ToastPositionerContext";
export function useToastPositionerContext() {
  const context = React.useContext(ToastPositionerContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ToastPositionerContext is missing. ToastPositioner parts must be placed within <Toast.Positioner>.' : _formatErrorMessage(84));
  }
  return context;
}