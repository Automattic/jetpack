'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const PreviewCardRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") PreviewCardRootContext.displayName = "PreviewCardRootContext";
export function usePreviewCardRootContext(optional) {
  const context = React.useContext(PreviewCardRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: PreviewCardRootContext is missing. PreviewCard parts must be placed within <PreviewCard.Root>.' : _formatErrorMessage(50));
  }
  return context;
}