"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectRootPropsContext = exports.SelectRootContext = exports.SelectFloatingContext = void 0;
exports.useSelectFloatingContext = useSelectFloatingContext;
exports.useSelectRootContext = useSelectRootContext;
exports.useSelectRootPropsContext = useSelectRootPropsContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
/**
 * Root values consumed during render. Keep these outside `useSyncedValues` so descendant ref
 * callbacks see the current props during the same commit.
 */

const SelectRootContext = exports.SelectRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectRootContext.displayName = "SelectRootContext";
const SelectRootPropsContext = exports.SelectRootPropsContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectRootPropsContext.displayName = "SelectRootPropsContext";
const SelectFloatingContext = exports.SelectFloatingContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectFloatingContext.displayName = "SelectFloatingContext";
function useSelectRootContext() {
  const store = React.useContext(SelectRootContext);
  if (store === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectRootContext is missing. Select parts must be placed within <Select.Root>.' : (0, _formatErrorMessage2.default)(60));
  }
  return store;
}
function useSelectRootPropsContext() {
  const context = React.useContext(SelectRootPropsContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectRootPropsContext is missing. Select parts must be placed within <Select.Root>.' : (0, _formatErrorMessage2.default)(101));
  }
  return context;
}
function useSelectFloatingContext() {
  const context = React.useContext(SelectFloatingContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectFloatingContext is missing. Select parts must be placed within <Select.Root>.' : (0, _formatErrorMessage2.default)(61));
  }
  return context;
}