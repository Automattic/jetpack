'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const PopoverRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") PopoverRootContext.displayName = "PopoverRootContext";
export function usePopoverRootContext(optional) {
  const context = React.useContext(PopoverRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: PopoverRootContext is missing. Popover parts must be placed within <Popover.Root>.' : _formatErrorMessage(47));
  }
  return context;
}