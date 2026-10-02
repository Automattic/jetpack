"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerProviderContext = void 0;
exports.useDrawerProviderContext = useDrawerProviderContext;
var React = _interopRequireWildcard(require("react"));
const DrawerProviderContext = exports.DrawerProviderContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DrawerProviderContext.displayName = "DrawerProviderContext";
function useDrawerProviderContext() {
  return React.useContext(DrawerProviderContext);
}