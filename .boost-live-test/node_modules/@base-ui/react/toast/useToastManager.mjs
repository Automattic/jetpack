'use client';

import * as React from 'react';
import { useToastProviderContext } from "./provider/ToastProviderContext.mjs";
/**
 * Returns the array of toasts and methods to manage them.
 */
export function useToastManager() {
  const store = useToastProviderContext();
  const toasts = store.useState('toasts');
  return React.useMemo(() => ({
    toasts,
    add: store.addToast,
    close: store.closeToast,
    update: store.updateToast,
    promise: store.promiseToast
  }), [toasts, store]);
}