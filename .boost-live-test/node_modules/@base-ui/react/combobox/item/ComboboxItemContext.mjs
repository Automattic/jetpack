'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const ComboboxItemContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxItemContext.displayName = "ComboboxItemContext";
export function useComboboxItemContext() {
  const context = React.useContext(ComboboxItemContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ComboboxItemContext is missing. ComboboxItem parts must be placed within <Combobox.Item>.' : _formatErrorMessage(19));
  }
  return context;
}