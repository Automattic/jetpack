'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const TooltipRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") TooltipRootContext.displayName = "TooltipRootContext";
export function useTooltipRootContext(optional) {
  const context = React.useContext(TooltipRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: TooltipRootContext is missing. Tooltip parts must be placed within <Tooltip.Root>.' : _formatErrorMessage(72));
  }
  return context;
}