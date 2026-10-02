"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastPositionerContext = void 0;
exports.useToastPositionerContext = useToastPositionerContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const ToastPositionerContext = exports.ToastPositionerContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ToastPositionerContext.displayName = "ToastPositionerContext";
function useToastPositionerContext() {
  const context = React.useContext(ToastPositionerContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ToastPositionerContext is missing. ToastPositioner parts must be placed within <Toast.Positioner>.' : (0, _formatErrorMessage2.default)(84));
  }
  return context;
}