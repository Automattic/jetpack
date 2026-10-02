"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectPositionerContext = void 0;
exports.useSelectPositionerContext = useSelectPositionerContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const SelectPositionerContext = exports.SelectPositionerContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectPositionerContext.displayName = "SelectPositionerContext";
function useSelectPositionerContext() {
  const context = React.useContext(SelectPositionerContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectPositionerContext is missing. SelectPositioner parts must be placed within <Select.Positioner>.' : (0, _formatErrorMessage2.default)(59));
  }
  return context;
}