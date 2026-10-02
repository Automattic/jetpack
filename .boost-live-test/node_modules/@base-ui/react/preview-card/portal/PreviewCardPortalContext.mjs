'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const PreviewCardPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") PreviewCardPortalContext.displayName = "PreviewCardPortalContext";
export function usePreviewCardPortalContext() {
  const value = React.useContext(PreviewCardPortalContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <PreviewCard.Portal> is missing.' : _formatErrorMessage(48));
  }
  return value;
}