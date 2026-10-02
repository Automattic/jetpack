"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectGroupContext = void 0;
exports.useSelectGroupContext = useSelectGroupContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const SelectGroupContext = exports.SelectGroupContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SelectGroupContext.displayName = "SelectGroupContext";
function useSelectGroupContext() {
  const context = React.useContext(SelectGroupContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SelectGroupContext is missing. SelectGroup parts must be placed within <Select.Group>.' : (0, _formatErrorMessage2.default)(56));
  }
  return context;
}