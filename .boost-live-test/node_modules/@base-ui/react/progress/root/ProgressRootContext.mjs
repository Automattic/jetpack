'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
/**
 * @internal
 */
export const ProgressRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ProgressRootContext.displayName = "ProgressRootContext";
export function useProgressRootContext() {
  const context = React.useContext(ProgressRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ProgressRootContext is missing. Progress parts must be placed within <Progress.Root>.' : _formatErrorMessage(51));
  }
  return context;
}