'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const RadioRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") RadioRootContext.displayName = "RadioRootContext";
export function useRadioRootContext() {
  const value = React.useContext(RadioRootContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: RadioRootContext is missing. Radio parts must be placed within <Radio.Root>.' : _formatErrorMessage(52));
  }
  return value;
}