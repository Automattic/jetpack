"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RadioGroupContext = void 0;
exports.useRadioGroupContext = useRadioGroupContext;
var React = _interopRequireWildcard(require("react"));
const RadioGroupContext = exports.RadioGroupContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") RadioGroupContext.displayName = "RadioGroupContext";
function useRadioGroupContext() {
  return React.useContext(RadioGroupContext);
}