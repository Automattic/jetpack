'use client';

import * as React from 'react';

/**
 * Holds the provider's `delay` value. `closeDelay` is handled by the delay group.
 */
export const TooltipProviderContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") TooltipProviderContext.displayName = "TooltipProviderContext";
export function useTooltipProviderContext() {
  return React.useContext(TooltipProviderContext);
}