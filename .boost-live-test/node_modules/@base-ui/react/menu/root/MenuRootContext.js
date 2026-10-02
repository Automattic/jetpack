"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuRootContext = void 0;
exports.useMenuRootContext = useMenuRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const MenuRootContext = exports.MenuRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") MenuRootContext.displayName = "MenuRootContext";
function useMenuRootContext(optional) {
  const context = React.useContext(MenuRootContext);
  if (context === undefined && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: MenuRootContext is missing. Menu parts must be placed within <Menu.Root>.' : (0, _formatErrorMessage2.default)(36));
  }
  return context;
}