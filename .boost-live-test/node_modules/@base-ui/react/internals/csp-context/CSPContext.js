"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CSPContext = void 0;
exports.useCSPContext = useCSPContext;
var React = _interopRequireWildcard(require("react"));
const CSPContext = exports.CSPContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") CSPContext.displayName = "CSPContext";
const DEFAULT_CSP_CONTEXT_VALUE = {
  disableStyleElements: false
};
function useCSPContext() {
  return React.useContext(CSPContext) ?? DEFAULT_CSP_CONTEXT_VALUE;
}