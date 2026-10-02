"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastRootContext = void 0;
exports.useToastRootContext = useToastRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const ToastRootContext = exports.ToastRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ToastRootContext.displayName = "ToastRootContext";
function useToastRootContext() {
  const context = React.useContext(ToastRootContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ToastRootContext is missing. Toast parts must be used within <Toast.Root>.' : (0, _formatErrorMessage2.default)(66));
  }
  return context;
}