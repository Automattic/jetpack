'use client';

import * as React from 'react';
export const CSPContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") CSPContext.displayName = "CSPContext";
const DEFAULT_CSP_CONTEXT_VALUE = {
  disableStyleElements: false
};
export function useCSPContext() {
  return React.useContext(CSPContext) ?? DEFAULT_CSP_CONTEXT_VALUE;
}