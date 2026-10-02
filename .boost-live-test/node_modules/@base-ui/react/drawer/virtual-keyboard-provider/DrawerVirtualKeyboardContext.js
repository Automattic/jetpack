"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerVirtualKeyboardContext = void 0;
exports.useDrawerVirtualKeyboardContext = useDrawerVirtualKeyboardContext;
var React = _interopRequireWildcard(require("react"));
const DrawerVirtualKeyboardContext = exports.DrawerVirtualKeyboardContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DrawerVirtualKeyboardContext.displayName = "DrawerVirtualKeyboardContext";
function useDrawerVirtualKeyboardContext() {
  return React.useContext(DrawerVirtualKeyboardContext);
}