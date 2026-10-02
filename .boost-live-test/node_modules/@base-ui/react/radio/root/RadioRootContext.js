"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RadioRootContext = void 0;
exports.useRadioRootContext = useRadioRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const RadioRootContext = exports.RadioRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") RadioRootContext.displayName = "RadioRootContext";
function useRadioRootContext() {
  const value = React.useContext(RadioRootContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: RadioRootContext is missing. Radio parts must be placed within <Radio.Root>.' : (0, _formatErrorMessage2.default)(52));
  }
  return value;
}