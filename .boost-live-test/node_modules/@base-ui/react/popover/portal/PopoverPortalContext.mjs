'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const PopoverPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") PopoverPortalContext.displayName = "PopoverPortalContext";
export function usePopoverPortalContext() {
  const value = React.useContext(PopoverPortalContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Popover.Portal> is missing.' : _formatErrorMessage(45));
  }
  return value;
}