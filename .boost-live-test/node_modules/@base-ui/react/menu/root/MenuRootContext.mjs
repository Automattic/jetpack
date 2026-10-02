'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const MenuRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MenuRootContext.displayName = "MenuRootContext";
export function useMenuRootContext(optional) {
  const context = React.useContext(MenuRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: MenuRootContext is missing. Menu parts must be placed within <Menu.Root>.' : _formatErrorMessage(36));
  }
  return context;
}