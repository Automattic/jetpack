'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const OTPFieldRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") OTPFieldRootContext.displayName = "OTPFieldRootContext";
export function useOTPFieldRootContext() {
  const context = React.useContext(OTPFieldRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: OTPFieldRootContext is missing. OTPField parts must be placed within <OTPField.Root>.' : _formatErrorMessage(98));
  }
  return context;
}
export function getOTPFieldInputState(state, value, index) {
  return {
    ...state,
    value,
    index,
    filled: value !== ''
  };
}