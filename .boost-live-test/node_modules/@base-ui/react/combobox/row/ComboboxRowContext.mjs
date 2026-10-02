'use client';

import * as React from 'react';
export const ComboboxRowContext = /*#__PURE__*/React.createContext(false);
if (process.env.NODE_ENV !== "production") ComboboxRowContext.displayName = "ComboboxRowContext";
export function useComboboxRowContext() {
  return React.useContext(ComboboxRowContext);
}