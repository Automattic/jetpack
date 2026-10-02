'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const NumberFieldRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NumberFieldRootContext.displayName = "NumberFieldRootContext";
export function useNumberFieldRootContext() {
  const context = React.useContext(NumberFieldRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: NumberFieldRootContext is missing. NumberField parts must be placed within <NumberField.Root>.' : _formatErrorMessage(43));
  }
  return context;
}