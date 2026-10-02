"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NumberFieldScrubAreaContext = void 0;
exports.useNumberFieldScrubAreaContext = useNumberFieldScrubAreaContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const NumberFieldScrubAreaContext = exports.NumberFieldScrubAreaContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NumberFieldScrubAreaContext.displayName = "NumberFieldScrubAreaContext";
function useNumberFieldScrubAreaContext() {
  const context = React.useContext(NumberFieldScrubAreaContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: NumberFieldScrubAreaContext is missing. NumberFieldScrubArea parts must be placed within <NumberField.ScrubArea>.' : (0, _formatErrorMessage2.default)(44));
  }
  return context;
}