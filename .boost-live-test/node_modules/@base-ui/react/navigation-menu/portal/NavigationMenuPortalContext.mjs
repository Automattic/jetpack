'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const NavigationMenuPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NavigationMenuPortalContext.displayName = "NavigationMenuPortalContext";
export function useNavigationMenuPortalContext() {
  const value = React.useContext(NavigationMenuPortalContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <NavigationMenu.Portal> is missing.' : _formatErrorMessage(40));
  }
  return value;
}