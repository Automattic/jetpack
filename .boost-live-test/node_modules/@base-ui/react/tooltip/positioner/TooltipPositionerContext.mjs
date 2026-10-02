'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const TooltipPositionerContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") TooltipPositionerContext.displayName = "TooltipPositionerContext";
export function useTooltipPositionerContext() {
  const context = React.useContext(TooltipPositionerContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: TooltipPositionerContext is missing. TooltipPositioner parts must be placed within <Tooltip.Positioner>.' : _formatErrorMessage(71));
  }
  return context;
}