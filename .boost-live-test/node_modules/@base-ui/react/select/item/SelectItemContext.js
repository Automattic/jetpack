"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectItemContext = void 0;
exports.useSelectItemContext = useSelectItemContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const SelectItemContext = exports.SelectItemContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectItemContext.displayName = "SelectItemContext";
function useSelectItemContext() {
  const context = React.useContext(SelectItemContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectItemContext is missing. SelectItem parts must be placed within <Select.Item>.' : (0, _formatErrorMessage2.default)(57));
  }
  return context;
}