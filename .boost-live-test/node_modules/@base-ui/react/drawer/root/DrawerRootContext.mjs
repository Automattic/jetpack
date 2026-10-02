'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const DrawerRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DrawerRootContext.displayName = "DrawerRootContext";
export function useDrawerRootContext(optional) {
  const drawerRootContext = React.useContext(DrawerRootContext);
  if (optional !== true && drawerRootContext === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: DrawerRootContext is missing. Drawer parts must be placed within <Drawer.Root>.' : _formatErrorMessage(90));
  }
  return drawerRootContext;
}