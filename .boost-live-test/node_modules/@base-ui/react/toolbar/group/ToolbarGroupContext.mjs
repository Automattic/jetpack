'use client';

import * as React from 'react';
export const ToolbarGroupContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ToolbarGroupContext.displayName = "ToolbarGroupContext";
export function useToolbarGroupContext() {
  return React.useContext(ToolbarGroupContext);
}