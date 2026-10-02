'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const MenuPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MenuPortalContext.displayName = "MenuPortalContext";
export function useMenuPortalContext() {
  const value = React.useContext(MenuPortalContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Menu.Portal> is missing.' : _formatErrorMessage(32));
  }
  return value;
}