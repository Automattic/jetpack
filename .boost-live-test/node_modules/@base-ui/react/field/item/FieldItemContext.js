"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FieldItemContext = void 0;
exports.useFieldItemContext = useFieldItemContext;
var React = _interopRequireWildcard(require("react"));
const FieldItemContext = exports.FieldItemContext = /*#__PURE__*/React.createContext({
  disabled: false
});
if (process.env.NODE_ENV !== "production") FieldItemContext.displayName = "FieldItemContext";
function useFieldItemContext() {
  const context = React.useContext(FieldItemContext);
  return context;
}