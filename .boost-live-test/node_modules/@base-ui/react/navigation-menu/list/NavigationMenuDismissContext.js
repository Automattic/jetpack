"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuDismissContext = void 0;
exports.useNavigationMenuDismissContext = useNavigationMenuDismissContext;
var React = _interopRequireWildcard(require("react"));
const NavigationMenuDismissContext = exports.NavigationMenuDismissContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NavigationMenuDismissContext.displayName = "NavigationMenuDismissContext";
function useNavigationMenuDismissContext() {
  return React.useContext(NavigationMenuDismissContext);
}