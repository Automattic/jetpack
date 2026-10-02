'use client';

import * as React from 'react';
export const CheckboxGroupContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") CheckboxGroupContext.displayName = "CheckboxGroupContext";
export function useCheckboxGroupContext() {
  return React.useContext(CheckboxGroupContext);
}