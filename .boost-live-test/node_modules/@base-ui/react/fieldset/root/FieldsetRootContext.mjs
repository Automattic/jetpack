'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const FieldsetRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") FieldsetRootContext.displayName = "FieldsetRootContext";
export function useFieldsetRootContext(optional = false) {
  const context = React.useContext(FieldsetRootContext);
  if (!context && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: FieldsetRootContext is missing. Fieldset parts must be placed within <Fieldset.Root>.' : _formatErrorMessage(86));
  }
  return context;
}