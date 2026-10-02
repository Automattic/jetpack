'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
/**
 * @internal
 */
export const TabsRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") TabsRootContext.displayName = "TabsRootContext";
export function useTabsRootContext() {
  const context = React.useContext(TabsRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: TabsRootContext is missing. Tabs parts must be placed within <Tabs.Root>.' : _formatErrorMessage(64));
  }
  return context;
}