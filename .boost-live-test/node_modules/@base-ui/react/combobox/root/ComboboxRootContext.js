"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxRootContext = exports.ComboboxInputValueContext = exports.ComboboxHasItemsContext = exports.ComboboxFloatingContext = exports.ComboboxDerivedItemsContext = void 0;
exports.useComboboxDerivedItemsContext = useComboboxDerivedItemsContext;
exports.useComboboxFloatingContext = useComboboxFloatingContext;
exports.useComboboxHasItemsContext = useComboboxHasItemsContext;
exports.useComboboxInputValueContext = useComboboxInputValueContext;
exports.useComboboxRootContext = useComboboxRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const ComboboxRootContext = exports.ComboboxRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxRootContext.displayName = "ComboboxRootContext";
const ComboboxFloatingContext = exports.ComboboxFloatingContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxFloatingContext.displayName = "ComboboxFloatingContext";
const ComboboxDerivedItemsContext = exports.ComboboxDerivedItemsContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxDerivedItemsContext.displayName = "ComboboxDerivedItemsContext";
const ComboboxHasItemsContext = exports.ComboboxHasItemsContext = /*#__PURE__*/React.createContext(false);
// `inputValue` can't be placed in the store.
// https://github.com/mui/base-ui/issues/2703
if (process.env.NODE_ENV !== "production") ComboboxHasItemsContext.displayName = "ComboboxHasItemsContext";
const ComboboxInputValueContext = exports.ComboboxInputValueContext = /*#__PURE__*/React.createContext('');
if (process.env.NODE_ENV !== "production") ComboboxInputValueContext.displayName = "ComboboxInputValueContext";
function useComboboxRootContext() {
  const context = React.useContext(ComboboxRootContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ComboboxRootContext is missing. Combobox parts must be placed within <Combobox.Root>.' : (0, _formatErrorMessage2.default)(22));
  }
  return context;
}
function useComboboxFloatingContext() {
  const context = React.useContext(ComboboxFloatingContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ComboboxFloatingContext is missing. Combobox parts must be placed within <Combobox.Root>.' : (0, _formatErrorMessage2.default)(23));
  }
  return context;
}
function useComboboxDerivedItemsContext() {
  const context = React.useContext(ComboboxDerivedItemsContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ComboboxItemsContext is missing. Combobox parts must be placed within <Combobox.Root>.' : (0, _formatErrorMessage2.default)(24));
  }
  return context;
}
function useComboboxInputValueContext() {
  return React.useContext(ComboboxInputValueContext);
}
function useComboboxHasItemsContext() {
  return React.useContext(ComboboxHasItemsContext);
}