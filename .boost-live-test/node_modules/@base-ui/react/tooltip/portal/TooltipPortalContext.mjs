'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const TooltipPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") TooltipPortalContext.displayName = "TooltipPortalContext";
export function useTooltipPortalContext() {
  const value = React.useContext(TooltipPortalContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Tooltip.Portal> is missing.' : _formatErrorMessage(70));
  }
  return value;
}