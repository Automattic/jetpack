"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuItemContext = void 0;
exports.useNavigationMenuItemContext = useNavigationMenuItemContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const NavigationMenuItemContext = exports.NavigationMenuItemContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NavigationMenuItemContext.displayName = "NavigationMenuItemContext";
function useNavigationMenuItemContext() {
  const value = React.useContext(NavigationMenuItemContext);
  if (!value) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: NavigationMenuItem parts must be used within a <NavigationMenu.Item>.' : (0, _formatErrorMessage2.default)(39));
  }
  return value;
}