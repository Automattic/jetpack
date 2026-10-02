'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const ComboboxPositionerContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxPositionerContext.displayName = "ComboboxPositionerContext";
export function useComboboxPositionerContext(optional) {
  const context = React.useContext(ComboboxPositionerContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Combobox.Popup> and <Combobox.Arrow> must be used within the <Combobox.Positioner> component' : _formatErrorMessage(21));
  }
  return context;
}