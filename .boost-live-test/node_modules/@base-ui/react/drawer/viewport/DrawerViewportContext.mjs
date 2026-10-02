'use client';

import * as React from 'react';
export const DrawerViewportContext = /*#__PURE__*/React.createContext(null);
if (process.env.NODE_ENV !== "production") DrawerViewportContext.displayName = "DrawerViewportContext";
export function useDrawerViewportContext() {
  return React.useContext(DrawerViewportContext);
}