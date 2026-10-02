"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuPortalContext = void 0;
exports.useNavigationMenuPortalContext = useNavigationMenuPortalContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const NavigationMenuPortalContext = exports.NavigationMenuPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") NavigationMenuPortalContext.displayName = "NavigationMenuPortalContext";
function useNavigationMenuPortalContext() {
  const value = React.useContext(NavigationMenuPortalContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <NavigationMenu.Portal> is missing.' : (0, _formatErrorMessage2.default)(40));
  }
  return value;
}