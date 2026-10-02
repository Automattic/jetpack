"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FieldsetRootContext = void 0;
exports.useFieldsetRootContext = useFieldsetRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const FieldsetRootContext = exports.FieldsetRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") FieldsetRootContext.displayName = "FieldsetRootContext";
function useFieldsetRootContext(optional = false) {
  const context = React.useContext(FieldsetRootContext);
  if (!context && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: FieldsetRootContext is missing. Fieldset parts must be placed within <Fieldset.Root>.' : (0, _formatErrorMessage2.default)(86));
  }
  return context;
}