'use client';

import * as React from 'react';
export const MenuSubmenuRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MenuSubmenuRootContext.displayName = "MenuSubmenuRootContext";
export function useMenuSubmenuRootContext() {
  return React.useContext(MenuSubmenuRootContext);
}