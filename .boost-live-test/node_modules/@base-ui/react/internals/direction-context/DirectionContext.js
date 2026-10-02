"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DirectionContext = void 0;
exports.useDirection = useDirection;
var React = _interopRequireWildcard(require("react"));
const DirectionContext = exports.DirectionContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DirectionContext.displayName = "DirectionContext";
function useDirection() {
  const context = React.useContext(DirectionContext);
  return context?.direction ?? 'ltr';
}