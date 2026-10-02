'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const ToolbarRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ToolbarRootContext.displayName = "ToolbarRootContext";
export function useToolbarRootContext(optional) {
  const context = React.useContext(ToolbarRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ToolbarRootContext is missing. Toolbar parts must be placed within <Toolbar.Root>.' : _formatErrorMessage(69));
  }
  return context;
}