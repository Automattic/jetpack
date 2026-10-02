"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MeterRootContext = void 0;
exports.useMeterRootContext = useMeterRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const MeterRootContext = exports.MeterRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MeterRootContext.displayName = "MeterRootContext";
function useMeterRootContext() {
  const context = React.useContext(MeterRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.' : (0, _formatErrorMessage2.default)(38));
  }
  return context;
}