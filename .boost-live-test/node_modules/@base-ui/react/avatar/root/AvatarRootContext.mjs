'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const AvatarRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") AvatarRootContext.displayName = "AvatarRootContext";
export function useAvatarRootContext() {
  const context = React.useContext(AvatarRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: AvatarRootContext is missing. Avatar parts must be placed within <Avatar.Root>.' : _formatErrorMessage(13));
  }
  return context;
}