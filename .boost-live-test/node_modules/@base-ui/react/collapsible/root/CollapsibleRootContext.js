"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CollapsibleRootContext = void 0;
exports.useCollapsibleRootContext = useCollapsibleRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const CollapsibleRootContext = exports.CollapsibleRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") CollapsibleRootContext.displayName = "CollapsibleRootContext";
function useCollapsibleRootContext() {
  const context = React.useContext(CollapsibleRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: CollapsibleRootContext is missing. Collapsible parts must be placed within <Collapsible.Root>.' : (0, _formatErrorMessage2.default)(15));
  }
  return context;
}