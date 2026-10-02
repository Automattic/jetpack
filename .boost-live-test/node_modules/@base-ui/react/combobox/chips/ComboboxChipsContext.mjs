'use client';

import * as React from 'react';
export const ComboboxChipsContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxChipsContext.displayName = "ComboboxChipsContext";
export function useComboboxChipsContext() {
  return React.useContext(ComboboxChipsContext);
}