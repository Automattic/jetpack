'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const ToastContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ToastContext.displayName = "ToastContext";
export function useToastProviderContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: useToastManager must be used within <Toast.Provider>.' : _formatErrorMessage(73));
  }
  return context;
}