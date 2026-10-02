'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const NavigationMenuItemContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NavigationMenuItemContext.displayName = "NavigationMenuItemContext";
export function useNavigationMenuItemContext() {
  const value = React.useContext(NavigationMenuItemContext);
  if (!value) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: NavigationMenuItem parts must be used within a <NavigationMenu.Item>.' : _formatErrorMessage(39));
  }
  return value;
}