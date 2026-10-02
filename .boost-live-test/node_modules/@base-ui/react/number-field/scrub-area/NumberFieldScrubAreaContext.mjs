'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const NumberFieldScrubAreaContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NumberFieldScrubAreaContext.displayName = "NumberFieldScrubAreaContext";
export function useNumberFieldScrubAreaContext() {
  const context = React.useContext(NumberFieldScrubAreaContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: NumberFieldScrubAreaContext is missing. NumberFieldScrubArea parts must be placed within <NumberField.ScrubArea>.' : _formatErrorMessage(44));
  }
  return context;
}