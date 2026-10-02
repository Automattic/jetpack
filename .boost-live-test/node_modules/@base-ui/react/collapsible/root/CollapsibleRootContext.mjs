'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const CollapsibleRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") CollapsibleRootContext.displayName = "CollapsibleRootContext";
export function useCollapsibleRootContext() {
  const context = React.useContext(CollapsibleRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: CollapsibleRootContext is missing. Collapsible parts must be placed within <Collapsible.Root>.' : _formatErrorMessage(15));
  }
  return context;
}