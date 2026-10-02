"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastContext = void 0;
exports.useToastProviderContext = useToastProviderContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const ToastContext = exports.ToastContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ToastContext.displayName = "ToastContext";
function useToastProviderContext() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: useToastManager must be used within <Toast.Provider>.' : (0, _formatErrorMessage2.default)(73));
  }
  return context;
}