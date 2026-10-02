'use client';

import * as React from 'react';
export const FieldItemContext = /*#__PURE__*/React.createContext({
  disabled: false
});
if (process.env.NODE_ENV !== "production") FieldItemContext.displayName = "FieldItemContext";
export function useFieldItemContext() {
  const context = React.useContext(FieldItemContext);
  return context;
}