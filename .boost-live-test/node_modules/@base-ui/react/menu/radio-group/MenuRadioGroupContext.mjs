'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const MenuRadioGroupContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MenuRadioGroupContext.displayName = "MenuRadioGroupContext";
export function useMenuRadioGroupContext() {
  const context = React.useContext(MenuRadioGroupContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: MenuRadioGroupContext is missing. MenuRadioGroup parts must be placed within <Menu.RadioGroup>.' : _formatErrorMessage(34));
  }
  return context;
}