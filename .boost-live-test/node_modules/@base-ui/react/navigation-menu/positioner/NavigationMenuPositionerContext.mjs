'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const NavigationMenuPositionerContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NavigationMenuPositionerContext.displayName = "NavigationMenuPositionerContext";
export function useNavigationMenuPositionerContext(optional = false) {
  const context = React.useContext(NavigationMenuPositionerContext);
  if (!context && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: NavigationMenuPositionerContext is missing. NavigationMenuPositioner parts must be placed within <NavigationMenu.Positioner>.' : _formatErrorMessage(42));
  }
  return context;
}