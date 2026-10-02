'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';

/**
 * Root values consumed during render. Keep these outside `useSyncedValues` so descendant ref
 * callbacks see the current props during the same commit.
 */

export const SelectRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectRootContext.displayName = "SelectRootContext";
export const SelectRootPropsContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectRootPropsContext.displayName = "SelectRootPropsContext";
export const SelectFloatingContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectFloatingContext.displayName = "SelectFloatingContext";
export function useSelectRootContext() {
  const store = React.useContext(SelectRootContext);
  if (store === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectRootContext is missing. Select parts must be placed within <Select.Root>.' : _formatErrorMessage(60));
  }
  return store;
}
export function useSelectRootPropsContext() {
  const context = React.useContext(SelectRootPropsContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectRootPropsContext is missing. Select parts must be placed within <Select.Root>.' : _formatErrorMessage(101));
  }
  return context;
}
export function useSelectFloatingContext() {
  const context = React.useContext(SelectFloatingContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectFloatingContext is missing. Select parts must be placed within <Select.Root>.' : _formatErrorMessage(61));
  }
  return context;
}