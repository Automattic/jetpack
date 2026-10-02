"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxItemContext = void 0;
exports.useComboboxItemContext = useComboboxItemContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const ComboboxItemContext = exports.ComboboxItemContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxItemContext.displayName = "ComboboxItemContext";
function useComboboxItemContext() {
  const context = React.useContext(ComboboxItemContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ComboboxItemContext is missing. ComboboxItem parts must be placed within <Combobox.Item>.' : (0, _formatErrorMessage2.default)(19));
  }
  return context;
}