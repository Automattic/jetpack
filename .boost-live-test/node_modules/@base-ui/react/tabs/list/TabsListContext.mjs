'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const TabsListContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") TabsListContext.displayName = "TabsListContext";
export function useTabsListContext() {
  const context = React.useContext(TabsListContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: TabsListContext is missing. TabsList parts must be placed within <Tabs.List>.' : _formatErrorMessage(65));
  }
  return context;
}