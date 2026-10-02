'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const SelectPositionerContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectPositionerContext.displayName = "SelectPositionerContext";
export function useSelectPositionerContext() {
  const context = React.useContext(SelectPositionerContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectPositionerContext is missing. SelectPositioner parts must be placed within <Select.Positioner>.' : _formatErrorMessage(59));
  }
  return context;
}