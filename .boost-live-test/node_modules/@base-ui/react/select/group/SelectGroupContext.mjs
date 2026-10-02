'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const SelectGroupContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectGroupContext.displayName = "SelectGroupContext";
export function useSelectGroupContext() {
  const context = React.useContext(SelectGroupContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectGroupContext is missing. SelectGroup parts must be placed within <Select.Group>.' : _formatErrorMessage(56));
  }
  return context;
}