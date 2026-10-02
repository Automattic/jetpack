'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const CompositeRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") CompositeRootContext.displayName = "CompositeRootContext";
export function useCompositeRootContext(optional = false) {
  const context = React.useContext(CompositeRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: CompositeRootContext is missing. Composite parts must be placed within <Composite.Root>.' : _formatErrorMessage(16));
  }
  return context;
}