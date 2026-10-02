'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const NavigationMenuRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NavigationMenuRootContext.displayName = "NavigationMenuRootContext";
if (process.env.NODE_ENV !== 'production') {
  NavigationMenuRootContext.displayName = 'NavigationMenuRootContext';
}
function useNavigationMenuRootContext(optional) {
  const context = React.useContext(NavigationMenuRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: NavigationMenuRootContext is missing. Navigation Menu parts must be placed within <NavigationMenu.Root>.' : _formatErrorMessage(41));
  }
  return context;
}
export const NavigationMenuTreeContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NavigationMenuTreeContext.displayName = "NavigationMenuTreeContext";
function useNavigationMenuTreeContext() {
  return React.useContext(NavigationMenuTreeContext);
}
export { useNavigationMenuRootContext, useNavigationMenuTreeContext };