'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const AccordionRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") AccordionRootContext.displayName = "AccordionRootContext";
export function useAccordionRootContext() {
  const context = React.useContext(AccordionRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: AccordionRootContext is missing. Accordion parts must be placed within <Accordion.Root>.' : _formatErrorMessage(10));
  }
  return context;
}