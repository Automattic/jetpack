"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OTPFieldRootContext = void 0;
exports.getOTPFieldInputState = getOTPFieldInputState;
exports.useOTPFieldRootContext = useOTPFieldRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const OTPFieldRootContext = exports.OTPFieldRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") OTPFieldRootContext.displayName = "OTPFieldRootContext";
function useOTPFieldRootContext() {
  const context = React.useContext(OTPFieldRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: OTPFieldRootContext is missing. OTPField parts must be placed within <OTPField.Root>.' : (0, _formatErrorMessage2.default)(98));
  }
  return context;
}
function getOTPFieldInputState(state, value, index) {
  return {
    ...state,
    value,
    index,
    filled: value !== ''
  };
}