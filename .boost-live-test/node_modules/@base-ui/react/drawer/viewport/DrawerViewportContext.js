"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerViewportContext = void 0;
exports.useDrawerViewportContext = useDrawerViewportContext;
var React = _interopRequireWildcard(require("react"));
const DrawerViewportContext = exports.DrawerViewportContext = /*#__PURE__*/React.createContext(null);
if (process.env.NODE_ENV !== "production") DrawerViewportContext.displayName = "DrawerViewportContext";
function useDrawerViewportContext() {
  return React.useContext(DrawerViewportContext);
}