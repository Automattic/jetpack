'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const PopoverPositionerContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") PopoverPositionerContext.displayName = "PopoverPositionerContext";
export function usePopoverPositionerContext() {
  const context = React.useContext(PopoverPositionerContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: PopoverPositionerContext is missing. PopoverPositioner parts must be placed within <Popover.Positioner>.' : _formatErrorMessage(46));
  }
  return context;
}