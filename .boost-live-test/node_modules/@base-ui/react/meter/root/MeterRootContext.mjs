'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const MeterRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MeterRootContext.displayName = "MeterRootContext";
export function useMeterRootContext() {
  const context = React.useContext(MeterRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.' : _formatErrorMessage(38));
  }
  return context;
}