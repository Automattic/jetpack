'use client';

import * as React from 'react';
export const NavigationMenuDismissContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NavigationMenuDismissContext.displayName = "NavigationMenuDismissContext";
export function useNavigationMenuDismissContext() {
  return React.useContext(NavigationMenuDismissContext);
}