"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PopoverRootContext = void 0;
exports.usePopoverRootContext = usePopoverRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const PopoverRootContext = exports.PopoverRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") PopoverRootContext.displayName = "PopoverRootContext";
function usePopoverRootContext(optional) {
  const context = React.useContext(PopoverRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: PopoverRootContext is missing. Popover parts must be placed within <Popover.Root>.' : (0, _formatErrorMessage2.default)(47));
  }
  return context;
}