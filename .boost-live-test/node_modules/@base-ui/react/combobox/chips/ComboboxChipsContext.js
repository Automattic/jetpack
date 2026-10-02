"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxChipsContext = void 0;
exports.useComboboxChipsContext = useComboboxChipsContext;
var React = _interopRequireWildcard(require("react"));
const ComboboxChipsContext = exports.ComboboxChipsContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") ComboboxChipsContext.displayName = "ComboboxChipsContext";
function useComboboxChipsContext() {
  return React.useContext(ComboboxChipsContext);
}