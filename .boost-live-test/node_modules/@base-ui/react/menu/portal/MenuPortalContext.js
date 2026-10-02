"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuPortalContext = void 0;
exports.useMenuPortalContext = useMenuPortalContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const MenuPortalContext = exports.MenuPortalContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MenuPortalContext.displayName = "MenuPortalContext";
function useMenuPortalContext() {
  const value = React.useContext(MenuPortalContext);
  if (value === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Menu.Portal> is missing.' : (0, _formatErrorMessage2.default)(32));
  }
  return value;
}