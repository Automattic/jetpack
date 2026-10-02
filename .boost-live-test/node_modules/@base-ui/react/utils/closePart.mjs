'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
export const ClosePartContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ClosePartContext.displayName = "ClosePartContext";
export function useClosePartCount() {
  const [closePartCount, setClosePartCount] = React.useState(0);
  const register = useStableCallback(() => {
    setClosePartCount(count => count + 1);
    return () => {
      setClosePartCount(count => Math.max(0, count - 1));
    };
  });
  const context = React.useMemo(() => ({
    register
  }), [register]);
  return {
    context,
    hasClosePart: closePartCount > 0
  };
}
export function useClosePartRegistration() {
  const context = React.useContext(ClosePartContext);
  useIsoLayoutEffect(() => {
    return context?.register();
  }, [context]);
}