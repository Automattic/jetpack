'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const ComboboxChipContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxChipContext.displayName = "ComboboxChipContext";
export function useComboboxChipContext() {
  const context = React.useContext(ComboboxChipContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ComboboxChipContext is missing. ComboboxChip parts must be placed within <Combobox.Chip>.' : _formatErrorMessage(17));
  }
  return context;
}