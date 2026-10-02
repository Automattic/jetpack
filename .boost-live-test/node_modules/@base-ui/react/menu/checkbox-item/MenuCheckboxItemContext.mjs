'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const MenuCheckboxItemContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MenuCheckboxItemContext.displayName = "MenuCheckboxItemContext";
export function useMenuCheckboxItemContext() {
  const context = React.useContext(MenuCheckboxItemContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: MenuCheckboxItemContext is missing. MenuCheckboxItem parts must be placed within <Menu.CheckboxItem>.' : _formatErrorMessage(30));
  }
  return context;
}