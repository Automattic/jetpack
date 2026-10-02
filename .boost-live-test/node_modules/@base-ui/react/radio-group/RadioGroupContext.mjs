'use client';

import * as React from 'react';
export const RadioGroupContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") RadioGroupContext.displayName = "RadioGroupContext";
export function useRadioGroupContext() {
  return React.useContext(RadioGroupContext);
}