'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const ComboboxRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxRootContext.displayName = "ComboboxRootContext";
export const ComboboxFloatingContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxFloatingContext.displayName = "ComboboxFloatingContext";
export const ComboboxDerivedItemsContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxDerivedItemsContext.displayName = "ComboboxDerivedItemsContext";
export const ComboboxHasItemsContext = /*#__PURE__*/React.createContext(false);
// `inputValue` can't be placed in the store.
// https://github.com/mui/base-ui/issues/2703
if (process.env.NODE_ENV !== "production") ComboboxHasItemsContext.displayName = "ComboboxHasItemsContext";
export const ComboboxInputValueContext = /*#__PURE__*/React.createContext('');
if (process.env.NODE_ENV !== "production") ComboboxInputValueContext.displayName = "ComboboxInputValueContext";
export function useComboboxRootContext() {
  const context = React.useContext(ComboboxRootContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ComboboxRootContext is missing. Combobox parts must be placed within <Combobox.Root>.' : _formatErrorMessage(22));
  }
  return context;
}
export function useComboboxFloatingContext() {
  const context = React.useContext(ComboboxFloatingContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ComboboxFloatingContext is missing. Combobox parts must be placed within <Combobox.Root>.' : _formatErrorMessage(23));
  }
  return context;
}
export function useComboboxDerivedItemsContext() {
  const context = React.useContext(ComboboxDerivedItemsContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ComboboxItemsContext is missing. Combobox parts must be placed within <Combobox.Root>.' : _formatErrorMessage(24));
  }
  return context;
}
export function useComboboxInputValueContext() {
  return React.useContext(ComboboxInputValueContext);
}
export function useComboboxHasItemsContext() {
  return React.useContext(ComboboxHasItemsContext);
}