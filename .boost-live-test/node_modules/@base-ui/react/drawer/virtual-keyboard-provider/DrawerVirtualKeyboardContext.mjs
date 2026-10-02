'use client';

import * as React from 'react';
export const DrawerVirtualKeyboardContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DrawerVirtualKeyboardContext.displayName = "DrawerVirtualKeyboardContext";
export function useDrawerVirtualKeyboardContext() {
  return React.useContext(DrawerVirtualKeyboardContext);
}