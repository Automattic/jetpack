"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CheckboxGroupContext = void 0;
exports.useCheckboxGroupContext = useCheckboxGroupContext;
var React = _interopRequireWildcard(require("react"));
const CheckboxGroupContext = exports.CheckboxGroupContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") CheckboxGroupContext.displayName = "CheckboxGroupContext";
function useCheckboxGroupContext() {
  return React.useContext(CheckboxGroupContext);
}