"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CompositeRootContext = void 0;
exports.useCompositeRootContext = useCompositeRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const CompositeRootContext = exports.CompositeRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") CompositeRootContext.displayName = "CompositeRootContext";
function useCompositeRootContext(optional = false) {
  const context = React.useContext(CompositeRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: CompositeRootContext is missing. Composite parts must be placed within <Composite.Root>.' : (0, _formatErrorMessage2.default)(16));
  }
  return context;
}