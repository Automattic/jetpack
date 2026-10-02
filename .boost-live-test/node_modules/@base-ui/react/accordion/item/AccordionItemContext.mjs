'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const AccordionItemContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") AccordionItemContext.displayName = "AccordionItemContext";
export function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: AccordionItemContext is missing. Accordion parts must be placed within <Accordion.Item>.' : _formatErrorMessage(9));
  }
  return context;
}