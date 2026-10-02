'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const ScrollAreaRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ScrollAreaRootContext.displayName = "ScrollAreaRootContext";
export function useScrollAreaRootContext() {
  const context = React.useContext(ScrollAreaRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ScrollAreaRootContext is missing. ScrollArea parts must be placed within <ScrollArea.Root>.' : _formatErrorMessage(53));
  }
  return context;
}