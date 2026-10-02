"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DrawerRootContext = void 0;
exports.useDrawerRootContext = useDrawerRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const DrawerRootContext = exports.DrawerRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") DrawerRootContext.displayName = "DrawerRootContext";
function useDrawerRootContext(optional) {
  const drawerRootContext = React.useContext(DrawerRootContext);
  if (optional !== true && drawerRootContext === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: DrawerRootContext is missing. Drawer parts must be placed within <Drawer.Root>.' : (0, _formatErrorMessage2.default)(90));
  }
  return drawerRootContext;
}