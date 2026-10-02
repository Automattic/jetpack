'use client';

import * as React from 'react';
export const ToggleGroupContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ToggleGroupContext.displayName = "ToggleGroupContext";
export function useToggleGroupContext() {
  return React.useContext(ToggleGroupContext);
}