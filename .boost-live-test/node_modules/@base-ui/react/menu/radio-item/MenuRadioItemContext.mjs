'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const MenuRadioItemContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MenuRadioItemContext.displayName = "MenuRadioItemContext";
export function useMenuRadioItemContext() {
  const context = React.useContext(MenuRadioItemContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: MenuRadioItemContext is missing. MenuRadioItem parts must be placed within <Menu.RadioItem>.' : _formatErrorMessage(35));
  }
  return context;
}