"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxRowContext = void 0;
exports.useComboboxRowContext = useComboboxRowContext;
var React = _interopRequireWildcard(require("react"));
const ComboboxRowContext = exports.ComboboxRowContext = /*#__PURE__*/React.createContext(false);
if (process.env.NODE_ENV !== "production") ComboboxRowContext.displayName = "ComboboxRowContext";
function useComboboxRowContext() {
  return React.useContext(ComboboxRowContext);
}