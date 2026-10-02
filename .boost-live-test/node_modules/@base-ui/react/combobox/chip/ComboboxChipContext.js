"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxChipContext = void 0;
exports.useComboboxChipContext = useComboboxChipContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const ComboboxChipContext = exports.ComboboxChipContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxChipContext.displayName = "ComboboxChipContext";
function useComboboxChipContext() {
  const context = React.useContext(ComboboxChipContext);
  if (!context) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: ComboboxChipContext is missing. ComboboxChip parts must be placed within <Combobox.Chip>.' : (0, _formatErrorMessage2.default)(17));
  }
  return context;
}