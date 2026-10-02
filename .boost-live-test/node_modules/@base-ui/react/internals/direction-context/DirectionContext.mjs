'use client';

import * as React from 'react';
export const DirectionContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DirectionContext.displayName = "DirectionContext";
export function useDirection() {
  const context = React.useContext(DirectionContext);
  return context?.direction ?? 'ltr';
}