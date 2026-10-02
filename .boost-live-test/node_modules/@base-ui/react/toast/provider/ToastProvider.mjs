'use client';

import * as React from 'react';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ToastContext } from "./ToastProviderContext.mjs";
import { ToastStore } from "../store.mjs";

/**
 * Provides a context for creating and managing toasts.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ToastProvider = function ToastProvider(props) {
  const {
    children,
    timeout = 5000,
    limit = 3,
    toastManager
  } = props;
  const store = useRefWithInit(() => new ToastStore({
    timeout,
    limit,
    viewport: null,
    toasts: [],
    hovering: false,
    focused: false,
    isWindowFocused: true,
    prevFocusElement: null
  })).current;
  useOnMount(store.disposeEffect);
  React.useEffect(function subscribeToToastManager() {
    if (!toastManager) {
      return undefined;
    }
    const unsubscribe = toastManager[' subscribe'](({
      action,
      options
    }) => {
      const id = options.id;
      if (action === 'promise' && options.promise) {
        store.promiseToast(options.promise, options);
      } else if (action === 'update' && id) {
        store.updateToast(id, options.updates);
      } else if (action === 'close') {
        store.closeToast(id);
      } else {
        store.addToast(options);
      }
    });
    return unsubscribe;
  }, [store, toastManager]);
  return /*#__PURE__*/_jsxs(ToastContext.Provider, {
    value: store,
    children: [/*#__PURE__*/_jsx(ToastProviderPropsSynchronizer, {
      store: store,
      timeout: timeout,
      limit: limit
    }), children]
  });
};
if (process.env.NODE_ENV !== "production") ToastProvider.displayName = "ToastProvider";
function ToastProviderPropsSynchronizer(props) {
  const {
    store,
    timeout,
    limit
  } = props;

  // `limit` needs custom syncing because changing it must also recompute each
  // toast's `limited` flag; `useSyncedValues` would only update the raw value.
  useIsoLayoutEffect(() => {
    store.syncProviderProps(timeout, limit);
  }, [store, timeout, limit]);
  return null;
}