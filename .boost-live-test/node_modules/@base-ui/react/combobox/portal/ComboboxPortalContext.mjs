'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const ComboboxPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxPortalContext.displayName = "ComboboxPortalContext";
export function useComboboxPortalContext() {
  const context = React.useContext(ComboboxPortalContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Combobox.Portal> is missing.' : _formatErrorMessage(20));
  }
  return context;
}