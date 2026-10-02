'use client';

import * as React from 'react';
export const DrawerProviderContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DrawerProviderContext.displayName = "DrawerProviderContext";
export function useDrawerProviderContext() {
  return React.useContext(DrawerProviderContext);
}